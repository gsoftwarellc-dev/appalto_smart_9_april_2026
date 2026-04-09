<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class ContractorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('it_IT');

        // Create 10 realistic contractors
        for ($i = 0; $i < 10; $i++) {
            User::create([
                'name' => $faker->name,
                'email' => "contractor{$i}@example.com",
                'password' => Hash::make('password123'),
                'role' => 'contractor',
                'company_name' => $faker->company,
                'vat_number' => $faker->vat,
                'fiscal_code' => $faker->taxId,
                'address' => $faker->streetAddress,
                'city' => $faker->city,
                'province' => $faker->stateAbbr,
                'phone' => $faker->phoneNumber,
                'legal_representative' => $faker->name,
            ]);
        }
    }
}
