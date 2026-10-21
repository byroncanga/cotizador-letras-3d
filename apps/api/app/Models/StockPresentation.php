<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['material_variant_id', 'supplier_id', 'width_mm', 'height_mm', 'margin_mm', 'purchase_price'])]
class StockPresentation extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['width_mm' => 'decimal:6', 'height_mm' => 'decimal:6', 'margin_mm' => 'decimal:6', 'purchase_price' => 'decimal:4'];
    }
}
