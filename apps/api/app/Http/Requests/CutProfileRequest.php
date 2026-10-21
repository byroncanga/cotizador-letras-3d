<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CutProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_owner;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'], 'machineName' => ['required', 'string', 'max:180'], 'materialId' => ['nullable', 'uuid', 'exists:material_variants,id'],
            'kerfMm' => ['nullable', 'numeric', 'min:0', 'max:1000'], 'spacingMm' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'ratePerMeter' => ['nullable', 'numeric', 'min:0', 'max:999999999', 'decimal:0,4'], 'setupCost' => ['nullable', 'numeric', 'min:0', 'max:999999999', 'decimal:0,4'], 'minimumCost' => ['nullable', 'numeric', 'min:0', 'max:999999999', 'decimal:0,4'], 'calibratedOn' => ['nullable', 'date_format:Y-m-d'],
        ];
    }
}
