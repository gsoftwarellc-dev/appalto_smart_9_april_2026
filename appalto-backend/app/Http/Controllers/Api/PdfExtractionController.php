<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPdfExtraction;
use App\Models\Document;
use App\Services\PdfExtractionService;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB; // Removed DB facade
use Illuminate\Support\Facades\Storage;

class PdfExtractionController extends Controller
{
    protected PdfExtractionService $extractionService;
    
    public function __construct(PdfExtractionService $extractionService)
    {
        $this->extractionService = $extractionService;
    }
    
    /**
     * Upload PDF and start extraction
     */
    public function uploadAndExtract(Request $request, $tenderId = null)
    {
        $request->validate([
            'pdf_file' => 'required_without:file|nullable|file|mimes:pdf|max:10240', // Max 10MB
            'file' => 'required_without:pdf_file|nullable|file|mimes:pdf|max:10240',
            'extraction_type' => 'string|in:standard,detailed,quick,bid_import',
        ], [
            'pdf_file.required_without' => 'The pdf file field is required.',
            'file.required_without' => 'The pdf file field is required.',
        ]);

        $file = $request->file('pdf_file') ?? $request->file('file');
        if (!$file) {
            return response()->json(['message' => 'The pdf file field is required.', 'error' => 'The pdf file field is required.'], 422);
        }

        try {
            // Store the uploaded PDF
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('pdfs', $fileName, 'public');
            $absolutePath = Storage::disk('public')->path($filePath);
            
            // Create document record
            $document = Document::create([
                'tender_id' => $tenderId,
                'document_type' => 'boq_pdf',
                'file_name' => $fileName,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'user_id' => $request->user()->id,
            ]);
            
            // Start extraction process
            $extractionType = $request->input('extraction_type', 'standard');
            $extractionId = $this->extractionService->startExtraction(
                $document->id,
                $tenderId,
                $absolutePath,
                $extractionType
            );
            
            // Process immediately (synchronous)
            $this->extractionService->processExtraction($extractionId, $absolutePath);
            
            return response()->json([
                'message' => 'PDF uploaded successfully. Extraction started.',
                'extraction_id' => $extractionId,
                'document_id' => $document->id,
            ], 202); // 202 Accepted
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get extraction status
     */
    public function getStatus($extractionId)
    {
        $extraction = $this->extractionService->getExtractionStatus($extractionId);
        
        if (!$extraction) {
            return response()->json(['message' => 'Extraction not found'], 404);
        }
        
        $response = [
            'id' => $extraction->id,
            'status' => $extraction->status,
            'extraction_type' => $extraction->extraction_type,
            'created_at' => $extraction->created_at,
            'processed_at' => $extraction->processed_at,
        ];
        
        // Include extracted data if completed
        if ($extraction->status === 'completed' && $extraction->ai_response) {
            $response['data'] = json_decode($extraction->ai_response, true);
            $response['confidence_score'] = $extraction->confidence_score;
        }
        
        // Include error if failed
        if ($extraction->status === 'failed') {
            $response['error'] = $extraction->error_message;
        }
        
        return response()->json($response);
    }
    
    /**
     * Get all extractions for a tender
     */
    public function getTenderExtractions($tenderId)
    {
        $extractions = $this->extractionService->getTenderExtractions($tenderId);
        
        return response()->json(['data' => $extractions]);
    }
}
