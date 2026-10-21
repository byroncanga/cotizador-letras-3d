<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class DesignAnalysisFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory()->owner(), 'source_hash' => hash('sha256', 'fixture'), 'file_name' => 'fixture.svg', 'source_path' => 'designs/fixture.svg', 'normalized' => ['version' => '1.0']];
    }
}
