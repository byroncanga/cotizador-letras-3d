<?php

namespace App\Domain\Costing;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use InvalidArgumentException;

final class CutCostCalculator
{
    public function calculate(string $cutLengthMm, string $ratePerMeter, string $setupCost, string $minimumCost): string
    {
        foreach ([$cutLengthMm, $ratePerMeter, $setupCost, $minimumCost] as $value) {
            if (BigDecimal::of($value)->isNegative()) {
                throw new InvalidArgumentException('Las longitudes y costos deben ser no negativos.');
            }
        }
        $meters = BigDecimal::of($cutLengthMm)->dividedBy('1000', 12, RoundingMode::HalfUp);
        $cost = $meters->multipliedBy($ratePerMeter)->plus($setupCost);

        return (string) BigDecimal::max($cost, $minimumCost)->toScale(4, RoundingMode::HalfUp);
    }
}
