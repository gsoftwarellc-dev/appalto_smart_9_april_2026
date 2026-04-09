<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class GeminiProvider implements AIProviderInterface
{
    protected $apiKey;
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent';
    protected $pdfParser;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
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
                'error' => 'Gemini API key is missing.',
            ];
        }

        try {
            // 1. Extract text from PDF
            $text = $this->extractText($filePath);
            
            if (empty(trim($text))) {
                return [
                    'success' => false,
                    'error' => 'Could not extract text from PDF. The file might be a scanned image.',
                ];
            }

            // 2. Prepare prompt
            $prompt = $this->buildPrompt($text, $extractionType);

            // 3. Call Gemini API
            $response = Http::timeout(120)->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'responseMimeType' => 'application/json'
                ]
            ]);

            if ($response->failed()) {
                throw new \Exception('Gemini API Error: ' . $response->body());
            }

            $responseData = $response->json();
            
            if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                 throw new \Exception('Invalid response format from Gemini');
            }

            $jsonContent = $responseData['candidates'][0]['content']['parts'][0]['text'];
            
            // Strip markdown JSON blocks if present
            $jsonContent = preg_replace('/^```json\s*/', '', $jsonContent);
            $jsonContent = preg_replace('/\s*```$/', '', $jsonContent);
            
            $data = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini JSON Parse Error: ' . json_last_error_msg());
                Log::error('Content: ' . $jsonContent);
                throw new \Exception('Failed to parse JSON response from Gemini');
            }

            return [
                'success' => true,
                'data' => $data,
                'confidence' => 0.9,
            ];

        } catch (\Exception $e) {
            Log::error('Gemini Extraction Error: ' . $e->getMessage());
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
        $typeInstruction = $extractionType === 'bid_import' 
            ? "This is a contractor's bid document. Focus on finding item quantities and unit prices."
            : "This is a standard technical document. Focus on finding item descriptions and estimated quantities.";
        
        return <<<EOT
$typeInstruction
Extract **all** Bill of Quantities (BOQ) items from the text below.
You must treat each numbered line (for example "1.1", "1.2", "2.1", "3.3", "4.2", etc.) that has a description and a quantity as a **separate BOQ item**.

Return generic JSON with this exact schema:

{
    "tender_info": {
        "title": "Project Title or Client Name",
        "location": "Project Location"
    },
    "boq_items": [
        {
            "description": "Full item description",
            "unit": "Unit of measurement (e.g., mq, mc, kg, a corpo, cad)",
            "quantity": 123.45,
            "item_type": "unit_priced" or "lump_sum"
        }
    ]
}

- Include **every** line item that has:
  - a description, and
  - a unit of measure, and
  - a quantity (for example "Quantità: 35,00" or "Q.tà 22,00").
- Do **not** merge multiple numbered items into a single BOQ row. Each numbered sub‑item like "1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "3.3", "4.1", "4.2" must become its own entry in `boq_items`.
- Explicitly **ignore** summary and total lines such as:
  - "Riepilogo importi principali"
  - Any line starting with "Totale ..."
  - Overall totals like "Totale complessivo", "Oneri sicurezza", "Spese generali", "IVA"
- "quantity" must be a number.
- "item_type" logic: if unit is 'a corpo' or 'cad', set to 'lump_sum', else 'unit_priced'.
- If a quantity is missing, set to 0.
- Ensure descriptions are detailed.

TEXT CONTENT:
----------------
$text
----------------
EOT;
    }
}
