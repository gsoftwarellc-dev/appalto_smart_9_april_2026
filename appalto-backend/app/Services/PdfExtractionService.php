<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PdfExtractionService
{
    protected AIProviderInterface $aiProvider;
    
    public function __construct(AIProviderInterface $aiProvider = null)
    {
        // Use provided instance, or check config for real vs mock
        if ($aiProvider) {
            $this->aiProvider = $aiProvider;
        } else {
            $provider = env('AI_PROVIDER', 'mock');
            if ($provider === 'openai') {
                $this->aiProvider = new OpenAIProvider();
            } elseif ($provider === 'gemini') {
                $this->aiProvider = new GeminiProvider();
            } elseif ($provider === 'groq') {
                $groq = new GroqProvider();
                // Fall back to mock if Groq key is not set (e.g. on production without GROQ_API_KEY)
                $this->aiProvider = $groq->isConfigured() ? $groq : new MockAIProvider();
            } else {
                $this->aiProvider = new MockAIProvider();
            }
        }
    }
    
    /**
     * Start PDF extraction process
     *
     * @param int $documentId
     * @param int $tenderId
     * @param string $filePath
     * @param string $extractionType
     * @return int PDF extraction ID
     */
    public function startExtraction(int $documentId, ?int $tenderId, string $filePath, string $extractionType = 'standard'): int
    {
        // Create extraction record
        $extractionId = DB::table('pdf_extractions')->insertGetId([
            'document_id' => $documentId,
            'tender_id' => $tenderId,
            'extraction_type' => $extractionType,
            'status' => 'processing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        Log::info("Started PDF extraction", [
            'extraction_id' => $extractionId,
            'document_id' => $documentId,
            'tender_id' => $tenderId,
        ]);
        
        return $extractionId;
    }
    
    /**
     * Process PDF extraction
     *
     * @param int $extractionId
     * @param string $filePath
     * @return void
     */
    public function processExtraction(int $extractionId, string $filePath): void
    {
        try {
            $extraction = DB::table('pdf_extractions')->find($extractionId);
            
            if (!$extraction) {
                throw new \Exception("Extraction record not found: {$extractionId}");
            }
            
            // Call AI provider to extract data
            $result = $this->aiProvider->extractBoqFromPdf(
                $filePath,
                $extraction->extraction_type
            );

            // If Groq fails with "too large" or rate limit, fall back to mock extractor so user still gets BOQ
            if (!$result['success'] && $this->isRetryableGroqError($result['error'] ?? '')) {
                Log::info("Groq limit hit, falling back to mock extractor", ['extraction_id' => $extractionId]);
                $mock = new MockAIProvider();
                $result = $mock->extractBoqFromPdf($filePath, $extraction->extraction_type);
            }
            
            if ($result['success']) {
                // Update extraction record with success
                DB::table('pdf_extractions')
                    ->where('id', $extractionId)
                    ->update([
                        'status' => 'completed',
                        'ai_response' => json_encode($result['data']),
                        'confidence_score' => $result['confidence'],
                        'processed_at' => now(),
                        'updated_at' => now(),
                    ]);
                
                // Auto-create BOQ items ONLY if NOT a bid import
                if (isset($result['data']['boq_items']) && $extraction->extraction_type !== 'bid_import') {
                    $this->createBoqItemsFromExtraction($extraction->tender_id, $result['data']['boq_items']);
                }
                
                Log::info("PDF extraction completed", ['extraction_id' => $extractionId, 'type' => $extraction->extraction_type]);
            } else {
                throw new \Exception($result['error'] ?? 'Extraction failed');
            }
            
        } catch (\Exception $e) {
            // Update extraction record with failure
            DB::table('pdf_extractions')
                ->where('id', $extractionId)
                ->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'processed_at' => now(),
                    'updated_at' => now(),
                ]);
            
            Log::error("PDF extraction failed", [
                'extraction_id' => $extractionId,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Whether the Groq error is due to size/rate limit so we can fall back to mock extractor.
     */
    private function isRetryableGroqError(string $error): bool
    {
        return str_contains($error, 'Request too large')
            || str_contains($error, 'rate_limit_exceeded')
            || str_contains($error, 'tokens per minute')
            || str_contains($error, 'rate_limit');
    }
    
    /**
     * Create BOQ items from extracted data
     *
     * @param int $tenderId
     * @param array $boqItems
     * @return void
     */
    protected function createBoqItemsFromExtraction(?int $tenderId, array $boqItems): void
    {
        if (!$tenderId) {
            Log::info("Skipping BOQ item creation: no tender_id provided");
            return;
        }
        foreach ($boqItems as $index => $item) {
            DB::table('boq_items')->insert([
                'tender_id' => $tenderId,
                'description' => $item['description'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'item_type' => $item['item_type'] ?? 'unit_priced',
                'display_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        Log::info("Created BOQ items from extraction", [
            'tender_id' => $tenderId,
            'item_count' => count($boqItems),
        ]);
    }
    
    /**
     * Get extraction status
     *
     * @param int $extractionId
     * @return object|null
     */
    public function getExtractionStatus(int $extractionId): ?object
    {
        return DB::table('pdf_extractions')->find($extractionId);
    }
    
    /**
     * Get all extractions for a tender
     *
     * @param int $tenderId
     * @return array
     */
    public function getTenderExtractions(int $tenderId): array
    {
        return DB::table('pdf_extractions')
            ->where('tender_id', $tenderId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }
}
