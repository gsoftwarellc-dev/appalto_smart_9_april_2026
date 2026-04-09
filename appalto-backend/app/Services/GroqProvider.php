<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class GroqProvider implements AIProviderInterface
{
    protected $apiKey;
    protected $baseUrl = 'https://api.groq.com/openai/v1';
    protected $pdfParser;

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
        $this->pdfParser = new Parser();
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function extractBoqFromPdf(string $filePath, string $extractionType): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Groq API key is missing. Add GROQ_API_KEY to .env.',
            ];
        }

        try {
            $text = $this->extractText($filePath);

            if (empty(trim($text))) {
                return [
                    'success' => false,
                    'error' => 'Could not extract text from PDF. The file might be a scanned image.',
                ];
            }

            // Groq on_demand tier has ~12k TPM; keep request under limit (~3 chars/token → ~22k chars for content)
            $maxChars = (int) env('GROQ_MAX_TEXT_CHARS', 22000);
            $truncated = strlen($text) > $maxChars;
            if ($truncated) {
                $text = substr($text, 0, $maxChars) . "\n\n[... testo troncato per limite API ...]";
            }

            $prompt = $this->buildPrompt($text, $extractionType);

            $payload = [
                'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an expert construction estimator and quantity surveyor. Your task is to extract Bill of Quantities (BOQ) items from PDF text. Reply ONLY with valid JSON, no markdown, no newlines inside strings.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.1,
                'max_tokens' => 16384,
            ];

            $response = Http::withToken($this->apiKey)
                ->timeout(120)
                ->post($this->baseUrl . '/chat/completions', $payload);

            if ($response->failed()) {
                throw new \Exception('Groq API Error: ' . $response->body());
            }

            $responseData = $response->json();
            if (!isset($responseData['choices'][0]['message']['content'])) {
                throw new \Exception('Invalid response format from Groq');
            }

            $jsonContent = trim($responseData['choices'][0]['message']['content']);
            $jsonContent = $this->extractJsonFromResponse($jsonContent);
            $jsonContent = $this->sanitizeJsonString($jsonContent);
            $jsonContent = $this->repairTruncatedJson($jsonContent);

            $data = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Groq JSON Parse Error: ' . json_last_error_msg());
                Log::error('Content: ' . substr($jsonContent, 0, 800));
                throw new \Exception('Failed to parse JSON response from Groq');
            }
            if (empty($data['boq_items']) || !is_array($data['boq_items'])) {
                $data['boq_items'] = [];
            }
            if (empty($data['tender_info'])) {
                $data['tender_info'] = ['title' => null, 'location' => null];
            }

            return [
                'success' => true,
                'data' => $data,
                'confidence' => 0.9,
            ];
        } catch (\Exception $e) {
            Log::error('Groq Extraction Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'AI processing failed: ' . $e->getMessage(),
            ];
        }
    }

    protected function extractText(string $filePath): string
    {
        try {
            $pdf = $this->pdfParser->parseFile($filePath);
            return $pdf->getText();
        } catch (\Exception $e) {
            Log::error('PDF Parsing Error: ' . $e->getMessage());
            return '';
        }
    }

    protected function buildPrompt(string $text, string $extractionType): string
    {
        return <<<EOT
Extract **all** Bill of Quantities (BOQ) items from the text below.
You must treat each numbered line (for example "1.1", "1.2", "2.1", "3.3", "4.2", etc.) that has a description and a quantity as a **separate BOQ item**.

Return ONLY valid JSON with the following structure:
{
    "tender_info": {
        "title": "Project Title or Client Name (if found)",
        "location": "Project Location (if found)"
    },
    "boq_items": [
        {
            "description": "Full item description",
            "unit": "Unit of measurement (e.g., mq, ml, mc, kg, a corpo, cad)",
            "quantity": 123.45 (number),
            "item_type": "unit_priced" or "lump_sum" (a corpo = lump_sum, others = unit_priced)
        }
    ]
}

- Include **every** line item that has a description, a unit (mq, ml, mc, kg, a corpo, etc.), and a quantity.
- Do **not** merge multiple numbered items into one. Each "1.1", "1.2", "2.1", etc. must be its own entry.
- Ignore summary/total lines: "Riepilogo", "Totale", "Oneri sicurezza", "Spese generali", "IVA".
- Parse European numbers correctly (1.234,56 -> 1234.56). If quantity is missing, set to 0.

TEXT CONTENT:
----------------
$text
----------------
EOT;
    }

    /**
     * Extract valid JSON from model response (may contain markdown or extra text).
     */
    protected function extractJsonFromResponse(string $raw): string
    {
        $s = trim($raw);
        $s = preg_replace('/^```(?:json)?\s*/i', '', $s);
        $s = preg_replace('/\s*```\s*$/i', '', $s);
        $s = trim($s);
        $start = strpos($s, '{');
        if ($start === false) {
            return $s;
        }
        $depth = 0;
        $end = -1;
        for ($i = $start; $i < strlen($s); $i++) {
            $c = $s[$i];
            if ($c === '{') {
                $depth++;
            } elseif ($c === '}') {
                $depth--;
                if ($depth === 0) {
                    $end = $i;
                    break;
                }
            }
        }
        if ($end >= 0) {
            return substr($s, $start, $end - $start + 1);
        }
        return $s;
    }

    /**
     * Remove control characters and normalize whitespace so json_decode does not fail.
     */
    protected function sanitizeJsonString(string $json): string
    {
        $json = str_replace(["\r\n", "\r", "\n"], ' ', $json);
        $json = preg_replace('/\s+/', ' ', $json);
        // Strip any remaining ASCII control characters (0x00-0x1F except space).
        $json = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $json);
        return trim($json);
    }

    /**
     * If Groq truncated the response mid-JSON, close the structure so we get partial BOQ items.
     */
    protected function repairTruncatedJson(string $json): string
    {
        $json = trim($json);
        if (substr($json, -1) === '}' && strpos($json, '"boq_items"') !== false) {
            return $json;
        }
        // Find last complete item: ends with "item_type": "unit_priced" } or "lump_sum" }
        if (preg_match('/\s*"item_type"\s*:\s*"(?:unit_priced|lump_sum)"\s*}\s*\]?\s*$/s', $json)) {
            return $json;
        }
        $lastComplete = preg_match_all('/"item_type"\s*:\s*"(?:unit_priced|lump_sum)"\s*}/', $json, $m);
        if ($lastComplete > 0) {
            $pos = strrpos($json, '"item_type"');
            $upTo = strpos($json, '}', $pos);
            if ($upTo !== false) {
                $cut = substr($json, 0, $upTo + 1);
                if (strpos($cut, '"boq_items"') !== false && substr_count($cut, '[') > substr_count($cut, ']')) {
                    return $cut . ' ] }';
                }
            }
        }
        // Truncated inside a string: close the string and the current item so JSON is valid
        if (preg_match('/"description"\s*:\s*"[^"]*$/s', $json)) {
            $json = preg_replace('/"description"\s*:\s*"[^"]*$/s', '"description": ""', $json);
            $json = rtrim($json);
            // Ensure current item and root are closed: add missing fields and brackets
            if (substr($json, -1) !== '}') {
                if (!preg_match('/,\s*"item_type"/', $json) || !preg_match('/"item_type"\s*:\s*"[^"]*"\s*}\s*$/', $json)) {
                    $json .= ', "unit": "mq", "quantity": 0, "item_type": "unit_priced" }';
                }
            }
            $open = substr_count($json, '[') - substr_count($json, ']');
            $openObj = substr_count($json, '{') - substr_count($json, '}');
            for ($i = 0; $i < $open; $i++) {
                $json .= ' ]';
            }
            for ($i = 0; $i < $openObj; $i++) {
                $json .= ' }';
            }
        }
        return $json;
    }
}
