<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBidRequest;
use App\Http\Resources\BidResource;
use App\Models\Bid;
use App\Models\BoqItem;
use App\Models\SystemConfig;
use App\Models\Tender;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Notifications\Messages\DatabaseMessage;

class BidController extends Controller
{
    /**
     * Get all bids for a tender. Admins and platform owners can inspect bids;
     * contractors can only see their own bids through myBids().
     */
    public function forTender(Request $request, $tenderId)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'owner'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Tender::findOrFail($tenderId);

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
        $bid = Bid::with(['tender', 'contractor'])->findOrFail($bidId);
        $tender = $bid->tender;
        $contractor = $bid->contractor;

        DB::transaction(function () use ($bid, $tender, $contractor) {
            $tender->award($bid->id);

            // Calculate success fee with possible early-adopter discount
            $baseFeePercent = (float) (SystemConfig::where('key', 'successFeePercent')->value('value') ?? 3.0);
            $discountPercent = 0.0;

            $discountEnabled = SystemConfig::where('key', 'successFeeDiscountEnabled')->value('value');
            if ($discountEnabled === '1' || $discountEnabled === 'true') {
                $discountFeePercent = (float) (SystemConfig::where('key', 'successFeeDiscountPercent')->value('value') ?? 0);
                $discountDays       = (int)   (SystemConfig::where('key', 'successFeeDiscountDays')->value('value') ?? 0);

                if ($discountFeePercent > 0 && $contractor) {
                    $registeredAt = $contractor->created_at;
                    $withinWindow = $discountDays <= 0 || $registeredAt->diffInDays(now()) <= $discountDays;

                    if ($withinWindow) {
                        $discountPercent = min($discountFeePercent, $baseFeePercent);
                    }
                }
            }

            $effectiveFeePercent = max(0, $baseFeePercent - $discountPercent);
            $feeAmount = round($bid->total_amount * ($effectiveFeePercent / 100), 2);

            if ($contractor && $feeAmount > 0) {
                $contractor->transactions()->create([
                    'type'        => 'fee',
                    'amount'      => 0,
                    'cash_amount' => $feeAmount,
                    'description' => sprintf(
                        'Success fee (%.1f%%) for tender: %s%s',
                        $effectiveFeePercent,
                        $tender->title,
                        $discountPercent > 0 ? sprintf(' [%.1f%% discount applied]', $discountPercent) : ''
                    ),
                    'status' => 'completed',
                ]);
            }
        });

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
        if (!$user || !in_array($user->role, ['admin', 'owner', 'contractor'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'contractor' && $bid->contractor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return new BidResource($bid);
    }
}
