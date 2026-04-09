<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBidRequest;
use App\Http\Resources\BidResource;
use App\Models\Bid;
use App\Models\BoqItem;
use App\Models\Tender;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Notifications\Messages\DatabaseMessage;
// use Illuminate\Support\Facades\DB; // Removed DB facade usage

class BidController extends Controller
{
    /**
     * Get all bids for a tender (admin only)
     */
    public function forTender($tenderId)
    {
        $bids = Bid::with(['contractor', 'bidItems.boqItem'])
            ->where('tender_id', $tenderId)
            ->latest()
            ->get();

        return BidResource::collection($bids);
    }

    /**
     * Get contractor's own bids
     */
    public function myBids(Request $request)
    {
        $bids = Bid::with(['tender', 'bidItems'])
            ->where('contractor_id', $request->user()->id)
            ->latest()
            ->get();

        return BidResource::collection($bids);
    }

    /**
     * Create or update a bid
     */
    public function store(StoreBidRequest $request, $tenderId)
    {
        $tender = Tender::findOrFail($tenderId);
        $user = $request->user();
        
        // Check if bid already exists
        $bid = Bid::where('tender_id', $tenderId)
            ->where('contractor_id', $user->id)
            ->first();

        if ($bid) {
            // Update existing bid
            $bid->bidItems()->delete();
        } else {
            // Create new bid
            $bid = Bid::create([
                'tender_id' => $tenderId,
                'contractor_id' => $user->id,
                'status' => 'draft',
                'total_amount' => 0,
            ]);
        }

        // Handle Base64 Offer File Upload if provided
        if ($request->has('offer_file_base64')) {
            $base64Data = $request->input('offer_file_base64');
            $originalName = $request->input('offer_file_name', 'offer.pdf');

            if (preg_match('/^data:[\w\/.\-]+;base64,/', $base64Data)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            }

            $fileData = base64_decode($base64Data);
            if ($fileData) {
                $fileName = time() . '_offer_' . $originalName;
                $filePath = 'bids/' . $user->id . '/' . $fileName;
                \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $fileData);
                
                // Delete old file if exists
                if ($bid->offer_file_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($bid->offer_file_path);
                }

                $bid->update([
                    'offer_file_path' => $filePath,
                    'offer_file_name' => $originalName
                ]);
            }
        }

        // Update proposal if provided
        if ($request->has('proposal')) {
            $bid->update(['proposal' => $request->input('proposal')]);
        }

        $discountType = $request->input('discount_type');
        $discountValue = $request->input('discount_value');

        // Insert bid items and calculate total
        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $boqItem = BoqItem::findOrFail($item['boq_item_id']);
                $isLumpSum = ($boqItem->item_type ?? 'unit_priced') === 'lump_sum';
                $quantity = $isLumpSum ? 1 : (float) ($item['quantity'] ?? 0);
                
                $bid->bidItems()->create([
                    'boq_item_id' => $item['boq_item_id'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $quantity,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        }

        // Recalculate total amount (including optional discount)
        $bid->calculateTotal($discountType, $discountValue);
        
        // Reload relationships
        $bid->load(['bidItems.boqItem', 'tender']);

        return new BidResource($bid);
    }

    /**
     * Submit a bid
     */
    public function submit($bidId)
    {
        $bid = Bid::findOrFail($bidId);
        
        // Ensure user owns the bid
        if (request()->user()->id !== $bid->contractor_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bid->submit();

        // Notify admin about new bid submission
        $tender = $bid->tender;
        $admin = User::where('role', 'admin')->where('id', $tender->created_by)->first();
        if ($admin) {
            $admin->notify(new \App\Notifications\BidSubmittedNotification($bid));
        }

        return new BidResource($bid);
    }

    /**
     * Award a tender to a bid (admin only)
     */
    public function award($bidId)
    {
        $bid = Bid::with('tender')->findOrFail($bidId);
        $tender = $bid->tender;

        $tender->award($bid->id);

        // Notify contractor about award
        $contractor = $bid->contractor;
        if ($contractor) {
            $contractor->notify(new \App\Notifications\BidAwardedNotification($bid));
        }

        return response()->json(['message' => 'Tender awarded successfully']);
    }
    /**
     * Get a single bid details (admin/owner/contractor who owns it)
     */
    public function show($id)
    {
        $bid = Bid::with(['contractor', 'bidItems.boqItem', 'tender'])->findOrFail($id);
        
        // Authorization check (basic)
        $user = request()->user();
        if ($user->role === 'contractor' && $bid->contractor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return new BidResource($bid);
    }
}
