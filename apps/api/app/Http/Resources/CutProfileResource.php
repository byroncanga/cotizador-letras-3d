<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CutProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'machineName' => $this->machine->name, 'materialId' => $this->material_variant_id ?? '',
            'kerfMm' => $this->kerf_mm === null ? null : (float) $this->kerf_mm, 'spacingMm' => $this->spacing_mm === null ? null : (float) $this->spacing_mm,
            'ratePerMeter' => $this->rate_per_meter, 'setupCost' => $this->setup_cost, 'minimumCost' => $this->minimum_cost, 'calibratedOn' => $this->calibrated_on?->format('Y-m-d') ?? '', 'updatedAt' => $this->updated_at->toISOString()];
    }
}
