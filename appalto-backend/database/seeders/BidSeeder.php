<?php

namespace Database\Seeders;

use App\Models\Bid;
use App\Models\Tender;
use App\Models\User;
use Illuminate\Database\Seeder;

class BidSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $contractors = User::contractors()->get();
        $publishedTenders = Tender::published()->get();

        foreach ($publishedTenders as $tender) {
            // For each tender, have 0-5 contractors bid on it
            // Ensure we don't try to take more contractors than exist
            $count = min(5, $contractors->count());
            if ($count > 0) {
                $biddingContractors = $contractors->random(rand(0, $count));
    
                foreach ($biddingContractors as $contractor) {
                    $bid = Bid::factory()
                        ->state([
                            'tender_id' => $tender->id,
                            'contractor_id' => $contractor->id,
                            'status' => rand(0, 1) ? 'draft' : 'submitted',
                        ])
                        ->create();
    
                    // Create bid items based on tender BOQ items
                    $totalAmount = 0;
                    foreach ($tender->boqItems as $boqItem) {
                        $unitPrice = $boqItem->item_type === 'lump_sum' 
                            ? rand(1000, 50000) 
                            : rand(10, 500);
    
                        $bidItem = $bid->bidItems()->create([
                            'boq_item_id' => $boqItem->id,
                            'unit_price' => $unitPrice,
                            'quantity' => $boqItem->quantity,
                            // amount calculated automatically
                        ]);
                        
                        // Manually calculate amount for total just to be sure, although model should handle it
                        $totalAmount += $bidItem->amount;
                    }
    
                    $bid->update(['total_amount' => $totalAmount]);
                    
                    if ($bid->status === 'submitted') {
                        $bid->update(['submitted_at' => now()]);
                    }
                }
            }
        }
    }
}
