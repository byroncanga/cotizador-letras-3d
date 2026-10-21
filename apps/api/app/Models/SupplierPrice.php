<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['stock_presentation_id', 'supplier_id', 'price', 'effective_at'])]
class SupplierPrice extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['price' => 'decimal:4', 'effective_at' => 'datetime'];
    }
}
