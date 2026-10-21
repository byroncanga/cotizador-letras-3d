<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'family', 'color', 'color_hex', 'thickness_mm', 'directional'])]
class MaterialVariant extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['thickness_mm' => 'decimal:6', 'directional' => 'boolean'];
    }

    public function presentations(): HasMany
    {
        return $this->hasMany(StockPresentation::class);
    }
}
