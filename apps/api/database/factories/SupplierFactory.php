<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class SupplierFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Proveedor de prueba', 'contact' => null, 'email' => null, 'phone' => null, 'notes' => null];
    }
}
