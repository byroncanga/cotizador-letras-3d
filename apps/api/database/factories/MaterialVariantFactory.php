<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class MaterialVariantFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Material de prueba', 'family' => 'Acrílico', 'color' => 'Prueba', 'thickness_mm' => '3.000000', 'directional' => false];
    }
}
