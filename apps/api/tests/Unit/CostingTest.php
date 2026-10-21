<?php

namespace Tests\Unit;

use App\Domain\Costing\CommercialPriceCalculator;
use App\Domain\Costing\CutCostCalculator;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CostingTest extends TestCase
{
    public function test_corte_por_metro_mas_preparacion_sin_cargo_horario(): void
    {
        $this->assertSame('8.0000', (new CutCostCalculator)->calculate('2500', '2', '3', '0'));
    }

    public function test_minimo_operativo_es_un_piso_y_no_un_cargo_adicional(): void
    {
        $this->assertSame('10.0000', (new CutCostCalculator)->calculate('2500', '2', '3', '10'));
    }

    public function test_decimales_se_conservan_sin_punto_flotante_binario(): void
    {
        $this->assertSame('0.3000', (new CutCostCalculator)->calculate('1000', '0.1', '0.2', '0'));
    }

    public function test_ganancia_se_calcula_sobre_el_costo(): void
    {
        $result = (new CommercialPriceCalculator)->calculate('80', '0.25', '0', '0');
        $this->assertSame('100.00', $result['net']);
        $this->assertSame('100.00', $result['total']);
        $this->assertFalse($result['minimumApplied']);
    }

    public function test_minimo_comercial_se_aplica_despues_de_ganancia_y_antes_del_impuesto(): void
    {
        $result = (new CommercialPriceCalculator)->calculate('80', '0.2', '110', '0.1');
        $this->assertSame('110.00', $result['net']);
        $this->assertSame('11.00', $result['tax']);
        $this->assertSame('121.00', $result['total']);
        $this->assertTrue($result['minimumApplied']);
    }

    public function test_ganancia_admite_cien_y_mas_de_cien_por_ciento(): void
    {
        $this->assertSame('160.00', (new CommercialPriceCalculator)->calculate('80', '1', '0', '0')['net']);
        $this->assertSame('280.00', (new CommercialPriceCalculator)->calculate('80', '2.5', '0', '0')['net']);
    }

    public function test_cantidades_negativas_se_rechazan(): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new CutCostCalculator)->calculate('-1', '2', '3', '0');
    }
}
