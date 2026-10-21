<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteDraftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'number' => $this->number, 'title' => $this->title, 'customer' => $this->customer_name ?? '', 'depthMm' => (float) $this->depth_mm,
            'frontMaterialId' => $this->front_material_id ?? '', 'backMaterialId' => $this->back_material_id ?? '', 'edgeMaterialId' => $this->edge_material_id ?? '',
            'billingMode' => $this->billing_mode, 'notes' => $this->notes ?? '', 'analysis' => $this->analysis?->normalized, 'isExample' => false, 'updatedAt' => $this->updated_at->toISOString()];
    }
}
