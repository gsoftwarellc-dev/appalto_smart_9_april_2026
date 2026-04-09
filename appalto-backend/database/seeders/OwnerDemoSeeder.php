<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OwnerDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create dummy contractors
        for ($i = 1; $i <= 5; $i++) {
            \App\Models\User::firstOrCreate(
                ['email' => "contractor{$i}@example.com"],
                [
                    'name' => "Contractor {$i}",
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    'role' => 'contractor',
                    'company_name' => "Contractor Company {$i} S.r.l.",
                    'verified' => $i % 2 == 0,
                    'status' => 'active',
                    'city' => 'Rome',
                    'rating' => 4.5
                ]
            );
        }

        // Create dummy clients (admins acting as clients)
        for ($i = 1; $i <= 3; $i++) {
            $client = \App\Models\User::firstOrCreate(
                ['email' => "client{$i}@example.com"],
                [
                    'name' => "Client {$i}",
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    'role' => 'admin',
                    'company_name' => "Client Company {$i} SpA",
                    'status' => 'active',
                    'city' => 'Milan'
                ]
            );

            // Create tenders for this client
            \App\Models\Tender::create([
                'title' => "Renovation Project - Building {$i}",
                'description' => "Complete renovation required for residential building {$i}",
                'location' => 'Rome',
                'deadline' => \Carbon\Carbon::now()->addDays(10 + $i),
                'status' => 'published',
                'budget' => 50000 + ($i * 10000),
                'created_by' => $client->id
            ]);
            
            // Create a "stalled" tender (simulated by published but expired/no bids)
            if ($i === 1) {
                 \App\Models\Tender::create([
                    'title' => "Stalled Project - Building {$i}",
                    'description' => "Project currently on hold",
                    'location' => 'Naples',
                    'deadline' => \Carbon\Carbon::now()->subDays(5),
                    'status' => 'published', // Use valid enum
                    'budget' => 15000,
                    'created_by' => $client->id
                ]);
            }
        }
    }
}
