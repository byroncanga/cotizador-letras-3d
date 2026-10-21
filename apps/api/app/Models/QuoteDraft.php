<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'number', 'title', 'customer_name', 'depth_mm', 'front_material_id', 'back_material_id', 'edge_material_id', 'design_analysis_id', 'billing_mode', 'notes', 'status'])]
class QuoteDraft extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['depth_mm' => 'decimal:6'];
    }

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(DesignAnalysis::class, 'design_analysis_id');
    }
}
