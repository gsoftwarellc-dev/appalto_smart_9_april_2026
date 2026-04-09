<?php

use App\Models\User;
use App\Models\Tender;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

// Create dummy contractors
for ($i = 0; $i < 5; $i++) {
    User::firstOrCreate(
        ['email' => "contractor{$i}@example.com"],
        [
            'name' => "Contractor {$i}",
            'password' => Hash::make('password'),
            'role' => 'contractor',
            'company_name' => "Contractor Company {$i}",
            'verified' => $i % 2 == 0, // Mix of verified/unverified
            'status' => 'active'
        ]
    );
}

// Create dummy clients (admins/owners acting as clients)
for ($i = 0; $i < 3; $i++) {
    $client = User::firstOrCreate(
        ['email' => "client{$i}@example.com"],
        [
            'name' => "Client {$i}",
            'password' => Hash::make('password'),
            'role' => 'admin', // Treating admin as client for this context
            'company_name' => "Client Company {$i}",
            'status' => 'active'
        ]
    );

    // Create tenders for this client
    Tender::create([
        'title' => "Renovation Project {$i}",
        'description' => "Description for project {$i}",
        'location' => 'Rome',
        'deadline' => Carbon::now()->addDays(10 + $i),
        'status' => 'published',
        'budget' => 50000 + ($i * 10000),
        'created_by' => $client->id
    ]);
}

echo "Seeding complete.\n";
