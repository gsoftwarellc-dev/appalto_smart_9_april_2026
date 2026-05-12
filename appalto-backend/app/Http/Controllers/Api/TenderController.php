<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenderRequest;
use App\Http\Requests\UpdateTenderRequest;
use App\Http\Resources\TenderResource;
use App\Models\Tender;
use App\Services\TenderCreditRequirementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenderController extends Controller
{
    /**
     * Display a listing of tenders
     */
    public function index(Request $request)
    {
        $query = Tender::query()
            ->withCount('bids');

        // Contractors only see published and active tenders
        if ($request->user() && $request->user()->isContractor()) {
            $query->active();
            
            // Check if saved by current user
            $query->withExists(['favoritedBy as is_saved' => function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            }]);
        }

        // Admins only see their own tenders
        if ($request->user() && $request->user()->role === 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        // Filtering
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->has('location') && $request->location && $request->location !== 'All') {
            $query->where('location', 'like', "%{$request->location}%");
        }

        if ($request->has('status') && $request->status && $request->status !== 'All') {
             // For contractors, status is usually 'published' (Open) or 'Urgent' (deadline close)
             if ($request->status === 'Urgent') {
                 $query->where('deadline', '<', now()->addDays(7));
             }
        }
        
        // Filter by saved tenders
        if ($request->has('saved') && $request->saved === 'true' && $request->user()) {
            $query->whereHas('favoritedBy', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });
        }

        return TenderResource::collection($query->latest()->get());
    }

    /**
     * Save/Favorite a tender
     */
    public function save(Request $request, $id)
    {
        $tender = Tender::findOrFail($id);
        $request->user()->savedTenders()->syncWithoutDetaching([$id]);
        return response()->json(['message' => 'Tender saved successfully']);
    }

    /**
     * Unsave/Unfavorite a tender
     */
    public function unsave(Request $request, $id)
    {
        $tender = Tender::findOrFail($id);
        $request->user()->savedTenders()->detach($id);
        return response()->json(['message' => 'Tender removed from saved list']);
    }

    /**
     * Unlock a tender for the authenticated contractor
     */
    public function unlock(Request $request, $id, TenderCreditRequirementService $creditRequirementService)
    {
        $user = $request->user();
        $tender = Tender::findOrFail($id);
        
        // Check if already unlocked
        if ($tender->isUnlockedBy($user)) {
             return response()->json(['message' => 'Tender already unlocked'], 200);
        }

        $unlockCost = $creditRequirementService->calculateForTender($tender);

        // Ensure the user has a credit record before checking the configured cost.
        if (!$user->credits) {
            $user->credits()->create(['balance' => 0]);
            $user->load('credits');
        }

        if ($user->credits->balance < $unlockCost) {
            return response()->json([
                'message' => 'Insufficient credits',
                'required_credits' => $unlockCost,
                'current_balance' => $user->credits->balance,
            ], 402);
        }

        try {
            DB::transaction(function () use ($user, $tender, $unlockCost) {
                // Deduct credits
                $user->credits()->decrement('balance', $unlockCost);

                // Create Transaction
                $user->transactions()->create([
                    'type' => 'unlock',
                    'amount' => -$unlockCost,
                    'description' => "Unlocked Tender: {$tender->title}",
                    'status' => 'completed',
                ]);

                // Record Unlock
                $tender->unlocks()->attach($user->id, ['credits_spent' => $unlockCost]);
            });

            return response()->json([
                'message' => 'Tender unlocked successfully',
                'credits_spent' => $unlockCost,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Unlock failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a new tender
     */
    public function store(StoreTenderRequest $request)
    {
        $data = $request->validated();

        $tender = DB::transaction(function () use ($request, $data) {
            $tender = Tender::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'location' => $this->formatTenderLocation($data['location'], $data['region']),
                'deadline' => $data['deadline'],
                'budget' => $data['budget'],
                'status' => 'published',
                'created_by' => $request->user()->id,
                'is_urgent' => $request->boolean('is_urgent', false),
            ]);

            if (isset($data['boq_items'])) {
                foreach ($data['boq_items'] as $index => $item) {
                    $tender->boqItems()->create([
                        'description' => $item['description'],
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                        'item_type' => $item['item_type'],
                        'display_order' => $index + 1,
                    ]);
                }
            }

            if (!empty($data['boq_document_id'])) {
                \App\Models\Document::where('id', $data['boq_document_id'])
                    ->whereNull('tender_id')
                    ->update(['tender_id' => $tender->id]);
            }

            return $tender;
        });

        return new TenderResource($tender);
    }

    /**
     * Display the specified tender
     */
    public function show(Request $request, $id)
    {
        $tender = Tender::with(['boqItems', 'bids' => function ($query) use ($request) {
            // If contractor, only show their own bid
            if ($request->user() && $request->user()->isContractor()) {
                $query->where('contractor_id', $request->user()->id);
            }
        }])->findOrFail($id);

        // Contractors can only view published tenders
        if ($request->user() && $request->user()->isContractor() && !$tender->isActive() && !$tender->isAwarded()) {
             // Allow viewing if awarded (historical) or just stick to active? 
             // Logic in original was: status !== published -> 404. 
             // Let's use isActive() or isAwarded() to be safe, or just check status.
             if ($tender->status !== 'published' && $tender->status !== 'awarded') {
                 return response()->json(['message' => 'Tender not found'], 404);
             }
        }

        return new TenderResource($tender);
    }

    /**
     * Update the specified tender
     */
    public function update(UpdateTenderRequest $request, $id)
    {
        $tender = Tender::findOrFail($id);
        $data = $request->validated();
        
        DB::transaction(function () use ($tender, $request, $data) {
            $updateData = $data;
            unset($updateData['boq_items']);

            if (array_key_exists('location', $data) || array_key_exists('region', $data)) {
                [$currentAddress, $currentRegion] = $this->splitTenderLocation($tender->location);
                $address = $data['location'] ?? $currentAddress;
                $region = $data['region'] ?? $currentRegion;

                if ($region) {
                    $updateData['location'] = $this->formatTenderLocation($address, $region);
                }
            }

            unset($updateData['region']);

            if (!empty($updateData)) {
                $tender->update($updateData);
            }
            
            if ($request->has('is_urgent')) {
                $tender->is_urgent = $request->boolean('is_urgent');
                $tender->save();
            }

            if (isset($data['boq_items'])) {
                // Delete existing items and recreate
                $tender->boqItems()->delete();
                
                foreach ($data['boq_items'] as $index => $item) {
                    $tender->boqItems()->create([
                        'description' => $item['description'],
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                        'item_type' => $item['item_type'],
                        'display_order' => $index + 1,
                    ]);
                }
            }
        });

        return new TenderResource($tender);
    }

    private function formatTenderLocation(string $address, string $region): string
    {
        return collect([trim($address), trim($region)])
            ->filter()
            ->implode(', ');
    }

    private function splitTenderLocation(?string $location): array
    {
        $location = trim((string) $location);
        $lastComma = strrpos($location, ', ');

        if ($lastComma === false) {
            return [$location, ''];
        }

        return [
            trim(substr($location, 0, $lastComma)),
            trim(substr($location, $lastComma + 2)),
        ];
    }

    /**
     * Publish a tender
     */
    public function publish($id)
    {
        $tender = Tender::findOrFail($id);
        $tender->publish();

        return new TenderResource($tender);
    }

    /**
     * Update BOQ items for a tender
     */
    public function updateBoqItems(Request $request, $id)
    {
        $tender = Tender::findOrFail($id);
        
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.item_type' => 'required|in:unit_priced,lump_sum',
        ]);

        // Delete existing BOQ items
        $tender->boqItems()->delete();

        // Insert new items
        foreach ($validated['items'] as $index => $item) {
            $tender->boqItems()->create([
                'description' => $item['description'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'item_type' => $item['item_type'],
                'display_order' => $index + 1,
            ]);
        }

        return response()->json(['message' => 'BOQ items updated successfully']);
    }

    /**
     * Delete a tender
     */
    public function destroy(Request $request, $id)
    {
        $tender = Tender::findOrFail($id);

        // Only the creator can delete
        if ($tender->created_by !== $request->user()->id && $request->user()->role !== 'owner') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::transaction(function () use ($tender) {
            // Delete related records
            $tender->boqItems()->delete();
            $tender->bids()->delete();
            $tender->documents()->delete();

            // Detach pivot relations
            if (method_exists($tender, 'unlocks')) {
                $tender->unlocks()->detach();
            }
            if (method_exists($tender, 'favoritedBy')) {
                $tender->favoritedBy()->detach();
            }

            $tender->delete();
        });

        return response()->json(['message' => 'Tender deleted successfully']);
    }
}
