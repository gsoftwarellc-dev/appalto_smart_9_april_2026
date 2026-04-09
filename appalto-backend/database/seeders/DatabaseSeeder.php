<?php

namespace Database\Seeders;

use App\Models\User;
// use App\Models\Tender; // Not needed if we use separate seeders
// use App\Models\Bid; // Not needed
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Use plain passwords here; User model's 'hashed' cast hashes them on save.
     */
    public function run(): void
    {
        $users = [
            [
                'email' => 'admin@example.com',
                'name' => 'Admin User',
                'role' => 'admin',
                'password' => 'password123',
            ],
            [
                'email' => 'contractor@example.com',
                'name' => 'Contractor User',
                'role' => 'contractor',
                'password' => 'password123',
                'company_name' => 'ABC Construction SRL',
                'vat_number' => 'IT12345678901',
                'fiscal_code' => 'ABCXYZ80A01H501Z',
                'address' => 'Via Roma 123',
                'city' => 'Milano',
                'province' => 'MI',
                'phone' => '+39 02 1234567',
                'legal_representative' => 'Mario Rossi',
            ],
            [
                'email' => 'owner@example.com',
                'name' => 'Owner User',
                'role' => 'owner',
                'password' => 'password123',
            ],
        ];

        foreach ($users as $data) {
            $user = User::firstOrNew(['email' => $data['email']]);
            $user->fill($data);
            $user->save();
        }

        // Run other seeders
        $this->call([
            ContractorSeeder::class,
            TenderSeeder::class,
            BidSeeder::class,
        ]);
    }
}
