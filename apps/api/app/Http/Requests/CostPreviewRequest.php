<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CostPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app()->environment(['local', 'testing']) && in_array($this->ip(), ['127.0.0.1', '::1'], true);
    }

    public function rules(): array
    {
        $decimal = ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,6})?$/', 'numeric', 'min:0', 'max:1000000000'];

        return [
            'materials' => ['required', 'array', 'min:1', 'max:30'],
            'materials.*.label' => ['required', 'string', 'max:180'],
            'materials.*.quantity' => [...$decimal, 'gt:0'],
            'materials.*.unitPrice' => $decimal,
            'cuts' => ['required', 'array', 'min:1', 'max:30'],
            'cuts.*.profileId' => ['required', 'string', 'max:100'],
            'cuts.*.label' => ['required', 'string', 'max:180'],
            'cuts.*.lengthMeters' => [...$decimal, 'gt:0'],
            'cuts.*.ratePerMeter' => $decimal,
            'cuts.*.setupCost' => $decimal,
            'cuts.*.minimumCost' => $decimal,
            'cutConfirmed' => ['sometimes', 'boolean'],
            'supplies' => ['sometimes', 'array', 'max:100'],
            'supplies.*.label' => ['required', 'string', 'max:180'],
            'supplies.*.quantity' => $decimal,
            'supplies.*.unitPrice' => $decimal,
            'labor' => ['present', 'array', 'max:50'],
            'labor.*.label' => ['required', 'string', 'max:180'],
            'labor.*.minutes' => [...$decimal, 'gt:0'],
            'labor.*.ratePerHour' => $decimal,
            'labor.*.complexity' => [...$decimal, 'min:1', 'max:100'],
            'noLabor' => ['required', 'boolean'],
            'vinylCost' => $decimal,
            'indirectCost' => $decimal,
            'markupPercent' => ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,6})?$/', 'numeric', 'min:0'],
            'taxPercent' => [...$decimal, 'max:100'],
            'commercialMinimum' => $decimal,
        ];
    }

    public function messages(): array
    {
        return ['required' => 'Completa :attribute; usa 0 solo cuando corresponda.', 'regex' => 'Usa un decimal positivo con hasta seis decimales en :attribute.'];
    }
}
