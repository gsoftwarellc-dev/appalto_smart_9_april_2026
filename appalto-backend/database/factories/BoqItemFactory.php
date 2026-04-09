<?php

namespace Database\Factories;

use App\Models\Tender;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BoqItem>
 */
class BoqItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tender_id' => Tender::factory(),
            'description' => $this->faker->sentence(4),
            'unit' => $this->faker->randomElement(['mq', 'ml', 'nr', 'kg', 'cad']),
            'quantity' => $this->faker->randomFloat(2, 1, 1000),
            'item_type' => $this->faker->randomElement(['unit_priced', 'lump_sum']),
            'display_order' => $this->faker->numberBetween(1, 100),
            'is_optional' => false,
        ];
    }
}
