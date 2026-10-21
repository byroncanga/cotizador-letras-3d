<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class MachineFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Máquina de prueba '.fake()->unique()->numerify('#####'), 'type' => null];
    }
}
