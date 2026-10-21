<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'machine_id', 'material_variant_id', 'kerf_mm', 'spacing_mm', 'rate_per_meter', 'setup_cost', 'minimum_cost', 'calibrated_on'])]
class CutProfile extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['kerf_mm' => 'decimal:6', 'spacing_mm' => 'decimal:6', 'rate_per_meter' => 'decimal:4', 'setup_cost' => 'decimal:4', 'minimum_cost' => 'decimal:4', 'calibrated_on' => 'date'];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
