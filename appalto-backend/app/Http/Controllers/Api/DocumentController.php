<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Tender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * List documents for a tender
     */
    public function index($tenderId)
    {
        $tender = Tender::findOrFail($tenderId);
        
        // Check authorization
        // Contractors can only see documents if tender is published/awarded
        if (request()->user()->isContractor() && !$tender->isActive() && !$tender->isAwarded()) {
             if ($tender->status !== 'published' && $tender->status !== 'awarded') {
                 return response()->json(['message' => 'Unauthorized'], 403);
             }
        }

        $documents = $tender->documents()->with('uploader')->latest()->get();

        return DocumentResource::collection($documents);
    }

    /**
     * List ALL documents for admin (Document Management page)
     */
    public function adminIndex(Request $request)
    {
        // Only admins can access this
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $documents = Document::with(['tender', 'uploader'])
            ->latest()
            ->get();

        return response()->json([
            'data' => DocumentResource::collection($documents)
        ]);
    }

    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tender_id' => 'required|exists:tenders,id',
            'file' => 'required|file|max:10240', // 10MB max
            'document_type' => 'required|string|in:specifications,drawing,contract,other,boq_pdf',
        ]);

        $tender = Tender::findOrFail($request->tender_id);
        
        // Only admin can upload documents (unless we allow contractors to upload something? For now admin only for tender docs)
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('documents', $fileName, 'public');

        $document = Document::create([
            'tender_id' => $tender->id,
            'filename' => $fileName,
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'document_type' => $request->document_type,
            'user_id' => $request->user()->id,
        ]);

        return new DocumentResource($document);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $document = Document::findOrFail($id);
        
        // Check access via tender
        $tender = $document->tender;
        if (request()->user()->isContractor() && !$tender->isActive() && !$tender->isAwarded()) {
             if ($tender->status !== 'published' && $tender->status !== 'awarded') {
                 return response()->json(['message' => 'Unauthorized'], 403);
             }
        }

        return new DocumentResource($document);
    }

    /**
     * Download the specified document.
     */
    public function download(string $id)
    {
        $document = Document::findOrFail($id);
        
        // Check access
        $tender = $document->tender;
        if (request()->user()->isContractor() && !$tender->isActive() && !$tender->isAwarded()) {
             if ($tender->status !== 'published' && $tender->status !== 'awarded') {
                 return response()->json(['message' => 'Unauthorized'], 403);
             }
        }

        if (!Storage::exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::download($document->file_path, $document->original_filename);
    }

    /**
     * Get document history for the authenticated contractor.
     */
    public function history(Request $request)
    {
        $user = $request->user();
        
        // Documents uploaded BY the user (e.g. Bid Offers)
        $uploadedDocs = Document::where('user_id', $user->id)
            ->with(['tender'])
            ->latest()
            ->get();
            
        // Documents the user has ACCESS to via their bids (e.g. BOQs for tenders they bid on)
        // For now, let's just return what they uploaded directly and perhaps 
        // BOQs for tenders where they have at least a draft.
        $bidTenderIds = $user->bids()->pluck('tender_id');
        $boqDocs = Document::whereIn('tender_id', $bidTenderIds)
            ->where('document_type', 'boq_pdf')
            ->with(['tender'])
            ->latest()
            ->get();
            
        return response()->json([
            'data' => DocumentResource::collection($uploadedDocs->concat($boqDocs)->unique('id')->sortByDesc('created_at'))
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $document = Document::findOrFail($id);
        
        // Only admin can delete
        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document->deleteFile(); // Custom method in model that deletes file and record

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
