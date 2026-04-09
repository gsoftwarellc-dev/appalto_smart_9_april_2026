<?php

namespace Database\Seeders;

use App\Models\BoqItem;
use App\Models\Tender;
use App\Models\User;
use Illuminate\Database\Seeder;

class TenderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        // Create 5 published tenders
        Tender::factory()
            ->count(5)
            ->published()
            ->state(['created_by' => $admin->id])
            ->create()
            ->each(function ($tender) {
                // Add 5-10 BOQ items to each tender
                BoqItem::factory()
                    ->count(rand(5, 10))
                    ->state(['tender_id' => $tender->id])
                    ->create();
            });

        // Create 3 draft tenders
        Tender::factory()
            ->count(3)
            ->draft()
            ->state(['created_by' => $admin->id])
            ->create()
            ->each(function ($tender) {
                // Add BOQ items
                BoqItem::factory()
                    ->count(rand(3, 8))
                    ->state(['tender_id' => $tender->id])
                    ->create();
            });
            
        // Create 2 closed tenders
        Tender::factory()
            ->count(2)
            ->state([
                'created_by' => $admin->id,
                'status' => 'closed',
                'deadline' => now()->subDays(rand(1, 30))
            ])
            ->create()
            ->each(function ($tender) {
                BoqItem::factory()
                    ->count(rand(5, 10))
                    ->state(['tender_id' => $tender->id])
                    ->create();
            });
    }
}
