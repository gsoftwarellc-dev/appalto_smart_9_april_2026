<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class ContractorController extends Controller
{
    /**
     * Display a listing of contractors
     */
    public function index()
    {
        // Admin only
        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contractors = User::contractors()->latest()->get();

        return UserResource::collection($contractors);
    }

    /**
     * Display the specified contractor
     */
    public function show($id)
    {
        // Admin only
        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contractor = User::contractors()->findOrFail($id);

        return new UserResource($contractor);
    }

    /**
     * Get contractor statistics
     */
    public function statistics($id)
    {
        // Admin only
        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contractor = User::contractors()->withCount('bids')->findOrFail($id);
        
        // Calculate other stats
        $totalBidsValue = $contractor->bids()->sum('total_amount');
        $awardedBidsCount = $contractor->bids()->awarded()->count();
        $awardedBidsValue = $contractor->bids()->awarded()->sum('total_amount');

        return response()->json([
            'contractor' => new UserResource($contractor),
            'stats' => [
                'total_bids_count' => $contractor->bids_count,
                'total_bids_value' => $totalBidsValue,
                'awarded_bids_count' => $awardedBidsCount,
                'awarded_bids_value' => $awardedBidsValue,
                'win_rate' => $contractor->bids_count > 0 
                    ? round(($awardedBidsCount / $contractor->bids_count) * 100, 1) 
                    : 0,
            ]
        ]);
    }
}
