<?php

namespace App\Http\Controllers\Api\Contractor;

use App\Http\Controllers\Controller;
use App\Services\PdfExtractionService;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AiScanController extends Controller
{
    protected PdfExtractionService $extractionService;

    public function __construct(PdfExtractionService $extractionService)
    {
        $this->extractionService = $extractionService;
    }

    public function scan(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,xls,xlsx|max:10240', // Max 10MB
            'tender_id' => 'required|integer|exists:tenders,id',
        ]);

        try {
            $file = $request->file('file');
            $tenderId = $request->input('tender_id');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('contractor_scans', $fileName, 'public');
            $absolutePath = Storage::disk('public')->path($filePath);

            // Create document record
            $document = Document::create([
                'tender_id' => $tenderId,
                'document_type' => 'bid_scan',
                'file_name' => $fileName,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'user_id' => $request->user()->id,
            ]);

            // Start extraction with 'bid_import' type
            $extractionId = $this->extractionService->startExtraction(
                $document->id,
                $tenderId,
                $absolutePath,
                'bid_import'
            );

            // Process immediately (for demo purposes, normally async)
            $this->extractionService->processExtraction($extractionId, $absolutePath);

            // Fetch result
            $status = $this->extractionService->getExtractionStatus($extractionId);

            if ($status->status === 'completed' && $status->ai_response) {
                return response()->json([
                    'message' => 'Scan completed successfully',
                    'data' => json_decode($status->ai_response, true),
                    'confidence' => $status->confidence_score
                ]);
            } else {
                return response()->json([
                    'message' => 'Scan failed',
                    'error' => $status->error_message
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
