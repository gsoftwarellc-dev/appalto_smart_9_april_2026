<?php

namespace App\Http\Controllers\Api\Contractor;

use App\Http\Controllers\Controller;
use App\Models\Credit;
use App\Models\Transaction;
use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    /**
     * Get the credit rate from system config.
     */
    private function getCreditsPerEuro(): float
    {
        $config = SystemConfig::where('key', 'creditsPerEuro')->first();
        return $config ? (float) $config->value : 1.0;
    }

    /**
     * Get billing overview (balance, transactions, and credit rate)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $credit = $user->credits ?: $user->credits()->create(['balance' => 0]);
        $transactions = $user->transactions()->latest()->limit(20)->get();
        
        return response()->json([
            'balance' => $credit->balance,
            'transactions' => $transactions,
            'creditsPerEuro' => $this->getCreditsPerEuro(),
        ]);
    }

    /**
     * Purchase credits (custom amount based on owner-configured rate)
     */
    public function purchaseCredits(Request $request)
    {
        // Support both old pack-based and new custom-amount format
        $credits = null;
        $price = null;
        $creditsPerEuro = $this->getCreditsPerEuro();

        if ($request->has('credits')) {
            // New format: contractor sends how many credits they want
            $request->validate([
                'credits' => 'required|integer|min:1',
            ]);
            $credits = (int) $request->credits;
            $price = $creditsPerEuro > 0 ? round($credits / $creditsPerEuro, 2) : 0;
        } elseif ($request->has('pack')) {
            // Legacy pack format for backward compatibility
            $request->validate([
                'pack' => 'required|string|in:basic,pro,premium',
            ]);
            $packs = [
                'basic'   => ['credits' => 50,  'price' => 50.00],
                'pro'     => ['credits' => 150, 'price' => 120.00],
                'premium' => ['credits' => 400, 'price' => 300.00],
            ];
            $selected = $packs[$request->pack];
            $credits = $selected['credits'];
            $price = $selected['price'];
        } else {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        $user = $request->user();

        return DB::transaction(function () use ($user, $credits, $price) {
            // Update balance
            $credit = $user->credits ?: $user->credits()->create(['balance' => 0]);
            $credit->increment('balance', $credits);

            // Create transaction
            $transaction = $user->transactions()->create([
                'type' => 'purchase',
                'amount' => $credits,
                'cash_amount' => $price,
                'description' => "Credit Purchase ({$credits} credits)",
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
