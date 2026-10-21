<?php

namespace Database\Factories;

use App\Models\Machine;
use App\Models\MaterialVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class CutProfileFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Perfil de prueba', 'machine_id' => Machine::factory(), 'material_variant_id' => MaterialVariant::factory(), 'kerf_mm' => null, 'spacing_mm' => null, 'rate_per_meter' => null, 'setup_cost' => null, 'minimum_cost' => null, 'calibrated_on' => null];
    }
}
