<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'action', 'entity_type', 'entity_id', 'changes'])]
class AuditEvent extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['changes' => 'array'];
    }
}
