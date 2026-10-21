<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CostPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_a_decimal_material_cut_labor_margin_and_tax_breakdown_without_database_records(): void
    {
        $response = $this->postJson('/local/cost-preview', [
            'materials' => [['label' => 'Pieza de prueba', 'quantity' => '2', 'unitPrice' => '10']],
            'cuts' => [['profileId' => 'prueba', 'label' => 'Perfil de prueba', 'lengthMeters' => '0.001', 'ratePerMeter' => '10', 'setupCost' => '5', 'minimumCost' => '8']],
            'cutConfirmed' => true,
            'materialReason' => 'Prueba automatizada local',
            'labor' => [['label' => 'Operación de prueba', 'minutes' => '30', 'ratePerHour' => '20', 'complexity' => '1.5']],
            'noLabor' => false,
            'vinylCost' => '5', 'indirectCost' => '2', 'markupPercent' => '20', 'taxPercent' => '15', 'commercialMinimum' => '0',
        ]);

        $response->assertOk()->assertJsonPath('data.materialTotal', '20.0000')->assertJsonPath('data.cutTotal', '8.0000')->assertJsonPath('data.laborTotal', '15.0000')->assertJsonPath('data.totalCost', '50.0000')->assertJsonPath('data.net', '60.00')->assertJsonPath('data.tax', '9.00')->assertJsonPath('data.total', '69.00');
        $this->assertDatabaseCount('quote_drafts', 0);
    }

    public function test_prices_update_without_manual_confirmation(): void
    {
        $response = $this->postJson('/local/cost-preview', [
            'materials' => [['label' => 'Material', 'quantity' => '1', 'unitPrice' => '1']],
            'cuts' => [['profileId' => 'prueba', 'label' => 'Perfil', 'lengthMeters' => '1', 'ratePerMeter' => '1', 'setupCost' => '0', 'minimumCost' => '0']],
            'cutConfirmed' => false, 'materialReason' => ' ', 'labor' => [], 'noLabor' => true,
            'vinylCost' => '0', 'indirectCost' => '0', 'markupPercent' => '0', 'taxPercent' => '0', 'commercialMinimum' => '0',
        ]);

        $response->assertOk()->assertJsonPath('data.total', '2.00');
    }

    public function test_manual_labor_exemption_is_required_when_no_labor_line_is_present(): void
    {
        $response = $this->postJson('/local/cost-preview', [
            'materials' => [['label' => 'Material', 'quantity' => '1', 'unitPrice' => '1']],
            'cuts' => [['profileId' => 'prueba', 'label' => 'Perfil', 'lengthMeters' => '1', 'ratePerMeter' => '1', 'setupCost' => '0', 'minimumCost' => '0']],
            'cutConfirmed' => true, 'materialReason' => 'Revisión del área en taller', 'labor' => [], 'noLabor' => false,
            'vinylCost' => '0', 'indirectCost' => '0', 'markupPercent' => '0', 'taxPercent' => '0', 'commercialMinimum' => '0',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('costs');
    }

    public function test_supplies_energy_and_large_markup_are_included_without_confirmation(): void
    {
        $this->postJson('/local/cost-preview', [
            'materials' => [['label' => 'Material', 'quantity' => '1', 'unitPrice' => '10']],
            'cuts' => [['profileId' => 'prueba', 'label' => 'Corte', 'lengthMeters' => '1', 'ratePerMeter' => '2', 'setupCost' => '0', 'minimumCost' => '0']],
            'supplies' => [['label' => 'Pegamento', 'quantity' => '5', 'unitPrice' => '0.2'], ['label' => 'Energía', 'quantity' => '2', 'unitPrice' => '0.5']],
            'labor' => [], 'noLabor' => true, 'vinylCost' => '0', 'indirectCost' => '0', 'markupPercent' => '150', 'taxPercent' => '0', 'commercialMinimum' => '0',
        ])->assertOk()->assertJsonPath('data.suppliesTotal', '2.0000')->assertJsonPath('data.totalCost', '14.0000')->assertJsonPath('data.total', '35.00');
    }
}
