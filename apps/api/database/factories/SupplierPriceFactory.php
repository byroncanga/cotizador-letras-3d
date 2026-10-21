<?php

namespace Database\Factories;

use App\Models\StockPresentation;
use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class SupplierPriceFactory extends Factory
{
    public function definition(): array
    {
        return ['stock_presentation_id' => StockPresentation::factory(), 'supplier_id' => null, 'price' => '10.0000', 'effective_at' => now()];
    }
}
