<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tender>
 */
class TenderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(3),
            'location' => $this->faker->city . ', ' . $this->faker->streetAddress,
            'deadline' => $this->faker->dateTimeBetween('+1 month', '+6 months'),
            'status' => $this->faker->randomElement(['draft', 'published', 'closed', 'awarded']),
            'budget' => $this->faker->randomFloat(2, 5000, 500000),
            'created_by' => User::factory(), // Will be overridden in seeder
        ];
    }
    
    public function published()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
        ]);
    }
    
    public function draft()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }
}
