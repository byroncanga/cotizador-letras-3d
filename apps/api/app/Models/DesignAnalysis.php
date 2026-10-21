<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'source_hash', 'file_name', 'source_path', 'normalized'])]
class DesignAnalysis extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['normalized' => 'array'];
    }
}
