<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $presentation = $this->presentations->first();

        return ['id' => $this->id, 'name' => $this->name, 'family' => $this->family, 'color' => $this->color, 'colorHex' => $this->color_hex, 'thicknessMm' => (float) $this->thickness_mm, 'directional' => $this->directional,
            'widthMm' => (float) $presentation?->width_mm, 'heightMm' => (float) $presentation?->height_mm, 'marginMm' => $presentation?->margin_mm === null ? null : (float) $presentation->margin_mm,
            'supplier' => $presentation?->supplier_id ?? '', 'purchasePrice' => $presentation?->purchase_price, 'updatedAt' => $this->updated_at->toISOString()];
    }
}
