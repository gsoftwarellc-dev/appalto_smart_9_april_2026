<?php

namespace App\Http\Controllers\Api\Contractor;

use App\Http\Controllers\Controller;
use App\Models\Credit;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    /**
     * Get billing overview (balance and transactions)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $credit = $user->credits ?: $user->credits()->create(['balance' => 0]);
        $transactions = $user->transactions()->latest()->limit(20)->get();
        
        return response()->json([
            'balance' => $credit->balance,
            'transactions' => $transactions
        ]);
    }

    /**
     * Purchase a credit pack (Mock Implementation)
     */
    public function purchaseCredits(Request $request)
    {
        $request->validate([
            'pack' => 'required|string|in:basic,pro,premium',
        ]);

        $packs = [
            'basic' => ['credits' => 50, 'price' => 50.00],
            'pro' => ['credits' => 150, 'price' => 120.00],
            'premium' => ['credits' => 400, 'price' => 300.00],
        ];

        $selectedPack = $packs[$request->pack];
        $user = $request->user();

        return DB::transaction(function () use ($user, $selectedPack, $request) {
            // Update balance
            $credit = $user->credits ?: $user->credits()->create(['balance' => 0]);
            $credit->increment('balance', $selectedPack['credits']);

            // Create transaction
            $transaction = $user->transactions()->create([
                'type' => 'purchase',
                'amount' => $selectedPack['credits'],
                'cash_amount' => $selectedPack['price'],
                'description' => "Credit Pack (" . ucfirst($request->pack) . ")",
                'status' => 'completed',
            ]);

            return response()->json([
                'message' => 'Credits purchased successfully',
                'balance' => $credit->balance,
                'transaction' => $transaction
            ]);
        });
    }
}
