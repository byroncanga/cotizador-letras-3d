<?php

namespace App\Domain\Costing;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use InvalidArgumentException;

final class QuoteCostCalculator
{
    public function __construct(private CutCostCalculator $cutCalculator, private CommercialPriceCalculator $priceCalculator) {}

    public function calculate(array $input): array
    {
        if (($input['noLabor'] && count($input['labor']) !== 0) || (! $input['noLabor'] && count($input['labor']) === 0)) {
            throw new InvalidArgumentException('Añade operaciones de mano de obra o confirma expresamente que no se cobra mano de obra.');
        }
        $materials = array_map(fn (array $line): array => ['label' => $line['label'], 'amount' => (string) BigDecimal::of($line['quantity'])->multipliedBy($line['unitPrice'])->toScale(4, RoundingMode::HalfUp)], $input['materials']);
        // Un mismo perfil se prepara una vez; su mínimo se aplica al recorrido acumulado.
        $profiles = [];
        foreach ($input['cuts'] as $line) {
            $key = $line['profileId'];
            if (! isset($profiles[$key])) {
                $profiles[$key] = $line;
            } else {
                $profiles[$key]['lengthMeters'] = (string) BigDecimal::of($profiles[$key]['lengthMeters'])->plus($line['lengthMeters']);
            }
        }
        $cuts = array_map(fn (array $line): array => ['label' => $line['label'], 'amount' => $this->cutCalculator->calculate((string) BigDecimal::of($line['lengthMeters'])->multipliedBy('1000'), $line['ratePerMeter'], $line['setupCost'], $line['minimumCost'])], array_values($profiles));
        $labor = array_map(fn (array $line): array => ['label' => $line['label'], 'amount' => (string) BigDecimal::of($line['minutes'])->multipliedBy($line['ratePerHour'])->multipliedBy($line['complexity'])->dividedBy('60', 4, RoundingMode::HalfUp)], $input['labor']);
        $supplies = array_map(fn (array $line): array => ['label' => $line['label'], 'amount' => (string) BigDecimal::of($line['quantity'])->multipliedBy($line['unitPrice'])->toScale(4, RoundingMode::HalfUp)], $input['supplies'] ?? []);
        $suppliesTotal = $this->sum($supplies);
        $materialTotal = $this->sum($materials);
        $cutTotal = $this->sum($cuts);
        $laborTotal = $this->sum($labor);
        $totalCost = BigDecimal::of($materialTotal)->plus($cutTotal)->plus($laborTotal)->plus($input['vinylCost'])->plus($input['indirectCost'])->plus($suppliesTotal)->toScale(4, RoundingMode::HalfUp);
        $markup = BigDecimal::of($input['markupPercent'])->dividedBy('100', 18, RoundingMode::HalfUp);
        $tax = BigDecimal::of($input['taxPercent'])->dividedBy('100', 8, RoundingMode::HalfUp);
        $price = $this->priceCalculator->calculate((string) $totalCost, (string) $markup, $input['commercialMinimum'], (string) $tax);

        return ['version' => '1.0', 'materials' => $materials, 'cuts' => $cuts, 'labor' => $labor, 'supplies' => $supplies, 'suppliesTotal' => $suppliesTotal, 'materialTotal' => $materialTotal, 'materialAndVinylTotal' => (string) BigDecimal::of($materialTotal)->plus($input['vinylCost'])->toScale(4, RoundingMode::HalfUp), 'cutTotal' => $cutTotal, 'laborTotal' => $laborTotal, 'vinylCost' => $input['vinylCost'], 'indirectCost' => $input['indirectCost'], 'totalCost' => (string) $totalCost, 'markupPercent' => $input['markupPercent'], 'taxPercent' => $input['taxPercent'], ...$price];
    }

    private function sum(array $lines): string
    {
        $total = BigDecimal::zero();
        foreach ($lines as $line) {
            $total = $total->plus($line['amount']);
        }

        return (string) $total->toScale(4, RoundingMode::HalfUp);
    }
}
