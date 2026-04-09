<?php

namespace App\Services;

use OpenAI;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;

class OpenAIProvider implements AIProviderInterface
{
    protected $client;
    protected $pdfParser;

    public function __construct()
    {
        $apiKey = env('OPENAI_API_KEY');
        if ($apiKey) {
            $this->client = OpenAI::client($apiKey);
        }
        $this->pdfParser = new Parser();
    }

    /**
     * Check if provider is configured
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty(env('OPENAI_API_KEY'));
    }

    /**
     * Extract BOQ data from PDF file
     *
     * @param string $filePath
     * @param string $extractionType
     * @return array
     */
    public function extractBoqFromPdf(string $filePath, string $extractionType): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'OpenAI API key is missing.',
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

            // 2. Prepare prompt for OpenAI
            $prompt = $this->buildPrompt($text, $extractionType);

            // 3. Call OpenAI API
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an expert construction estimator and quantity surveyor. Your task is to extract Bill of Quantities (BOQ) items from PDF text.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.1, // Low temperature for consistent JSON output
                'response_format' => ['type' => 'json_object'],
            ]);

            $content = $response->choices[0]->message->content;
            $data = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Failed to parse JSON response from OpenAI: ' . json_last_error_msg());
            }

            return [
                'success' => true,
                'data' => $data,
                'confidence' => 0.9, // OpenAI doesn't give confidence score for chat, assuming high if successful
            ];

        } catch (\Exception $e) {
            Log::error('OpenAI Extraction Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'AI processing failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Extract raw text from PDF
     */
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

    /**
     * Build the prompt for OpenAI
     */
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
            "unit": "Unit of measurement (e.g., mq, mc, kg, a corpo, cad)",
            "quantity": 123.45 (number),
            "item_type": "unit_priced" or "lump_sum" (determine based on unit: 'a corpo' usually means lump_sum, others are unit_priced)
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
- If a quantity is missing or invalid, set it to 0.
- Ensure all numbers are parsed correctly (European format 1.234,56 -> 1234.56).
- Ignore header/footer noise if possible.

TEXT CONTENT:
----------------
$text
----------------
EOT;
    }
}
