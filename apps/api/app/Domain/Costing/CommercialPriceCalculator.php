<?php

namespace App\Domain\Costing;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use InvalidArgumentException;

final class CommercialPriceCalculator
{
    public function calculate(string $cost, string $markup, string $commercialMinimum, string $taxFraction): array
    {
        $costValue = BigDecimal::of($cost);
        $markupValue = BigDecimal::of($markup);
        if ($costValue->isNegative() || $markupValue->isNegative() || BigDecimal::of($commercialMinimum)->isNegative() || BigDecimal::of($taxFraction)->isNegative()) {
            throw new InvalidArgumentException('Revisa costos, impuestos y ganancia; deben ser valores positivos.');
        }
        $base = $costValue->multipliedBy(BigDecimal::one()->plus($markupValue));
        $net = BigDecimal::max($base, $commercialMinimum)->toScale(2, RoundingMode::HalfUp);
        $tax = $net->multipliedBy($taxFraction)->toScale(2, RoundingMode::HalfUp);

        return ['net' => (string) $net, 'tax' => (string) $tax, 'total' => (string) $net->plus($tax), 'minimumApplied' => $net->isGreaterThan($base->toScale(2, RoundingMode::HalfUp))];
    }
}
