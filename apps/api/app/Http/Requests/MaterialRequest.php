<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_owner;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'], 'family' => ['required', 'string', 'max:100'], 'color' => ['required', 'string', 'max:100'],
            'colorHex' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'thicknessMm' => ['required', 'numeric', 'gt:0', 'max:10000'], 'widthMm' => ['required', 'numeric', 'gt:0', 'max:100000'], 'heightMm' => ['required', 'numeric', 'gt:0', 'max:100000'],
            'marginMm' => ['nullable', 'numeric', 'min:0', 'max:10000'], 'directional' => ['required', 'boolean'], 'supplier' => ['nullable', 'uuid', 'exists:suppliers,id'],
            'purchasePrice' => ['nullable', 'numeric', 'min:0', 'max:999999999', 'decimal:0,4'],
        ];
    }
}
