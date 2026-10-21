<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class QuoteDraftFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory()->owner(), 'number' => 'BOR-'.strtoupper(fake()->unique()->bothify('????????')), 'title' => 'Borrador de prueba', 'customer_name' => null, 'depth_mm' => '50.000000', 'billing_mode' => 'proportional', 'status' => 'draft'];
    }
}
