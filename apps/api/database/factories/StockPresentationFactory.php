<?php

namespace Database\Factories;

use App\Models\MaterialVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** Fixtures ficticias: exclusivamente para pruebas, nunca para carga de producción. */
class StockPresentationFactory extends Factory
{
    public function definition(): array
    {
        return ['material_variant_id' => MaterialVariant::factory(), 'supplier_id' => null, 'width_mm' => '1200.000000', 'height_mm' => '2400.000000', 'margin_mm' => null, 'purchase_price' => null];
    }
}
