<?php

namespace Tests\Feature;

use App\Models\MaterialVariant;
use App\Models\QuoteDraft;
use App\Models\Supplier;
use App\Models\SupplierPrice;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkshopApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_catalogo_requiere_sesion_401(): void
    {
        $this->getJson('/api/v1/materials')->assertUnauthorized();
    }

    public function test_usuario_sin_rol_propietario_no_puede_gestionar_usuarios(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/users', [])->assertForbidden();
    }

    public function test_primera_visita_permite_crear_la_cuenta_propietaria_una_sola_vez(): void
    {
        $this->getJson('/api/v1/setup/status')->assertOk()->assertJsonPath('data.needsOwner', true);
        $response = $this->postJson('/api/v1/setup/owner', ['name' => 'Dueña del taller', 'email' => 'owner@example.test', 'password' => 'contraseña-segura-2026', 'password_confirmation' => 'contraseña-segura-2026']);
        $response->assertOk()->assertJsonPath('data.email', 'owner@example.test')->assertJsonPath('data.isOwner', true);
        $this->assertAuthenticated();
        $this->getJson('/api/v1/setup/status')->assertOk()->assertJsonPath('data.needsOwner', false);
        $this->postJson('/api/v1/setup/owner', ['name' => 'Otra cuenta', 'email' => 'other@example.test', 'password' => 'contraseña-segura-2026', 'password_confirmation' => 'contraseña-segura-2026'])->assertConflict();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_propietario_crea_operadores_y_solo_el_propietario_lista_usuarios(): void
    {
        $owner = User::factory()->owner()->create();
        $response = $this->actingAs($owner)->postJson('/api/v1/users', ['name' => 'Operadora', 'email' => 'operadora@example.test', 'password' => 'clave-operadora-2026', 'password_confirmation' => 'clave-operadora-2026', 'isOwner' => false]);
        $response->assertCreated()->assertJsonPath('data.isOwner', false)->assertJsonMissingPath('data.password');
        $this->assertDatabaseHas('users', ['email' => 'operadora@example.test', 'is_owner' => false]);
        $this->assertNotSame('clave-operadora-2026', (string) \App\Models\User::where('email', 'operadora@example.test')->value('password'));
        $this->getJson('/api/v1/users')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs(User::where('email', 'operadora@example.test')->firstOrFail())->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_usuario_operador_puede_iniciar_sesion_sin_permisos_de_propietario(): void
    {
        User::factory()->create(['email' => 'operadora@example.test', 'password' => 'clave-operadora-2026']);

        $this->postJson('/api/v1/login', ['email' => 'operadora@example.test', 'password' => 'clave-operadora-2026'])
            ->assertOk()->assertJsonPath('data.isOwner', false);
        $this->assertAuthenticated();
    }

    public function test_material_guarda_precios_desconocidos_como_null(): void
    {
        $owner = User::factory()->owner()->create();
        $response = $this->actingAs($owner)->postJson('/api/v1/materials', $this->materialPayload());
        $response->assertSuccessful()->assertJsonPath('data.purchasePrice', null)->assertJsonPath('data.widthMm', 1200);
        $this->assertDatabaseHas('material_variants', ['name' => 'Material de prueba', 'thickness_mm' => 3]);
        $this->assertDatabaseHas('stock_presentations', ['purchase_price' => null, 'margin_mm' => null]);
        $this->assertDatabaseHas('audit_events', ['user_id' => $owner->id, 'action' => 'material.saved']);
    }

    public function test_historial_conserva_precio_anterior_al_actualizar_catalogo(): void
    {
        $owner = User::factory()->owner()->create();
        $supplier = Supplier::factory()->create();
        $payload = [...$this->materialPayload(), 'supplier' => $supplier->id, 'purchasePrice' => '10.00'];
        $id = $this->actingAs($owner)->postJson('/api/v1/materials', $payload)->assertSuccessful()->json('data.id');
        $this->putJson('/api/v1/materials/'.$id, [...$payload, 'purchasePrice' => '12.00'])->assertSuccessful()->assertJsonPath('data.purchasePrice', '12.0000');
        $this->assertSame(2, SupplierPrice::count());
        $this->assertDatabaseHas('supplier_prices', ['price' => 10]);
        $this->assertDatabaseHas('supplier_prices', ['price' => 12]);
    }

    public function test_dimensiones_invalidas_no_se_guardan_422(): void
    {
        $this->actingAs(User::factory()->owner()->create())->postJson('/api/v1/materials', [...$this->materialPayload(), 'thicknessMm' => -1])->assertUnprocessable()->assertJsonValidationErrors('thicknessMm');
        $this->assertDatabaseCount('material_variants', 0);
    }

    public function test_perfil_usa_tarifa_por_metro_y_no_requiere_velocidad_ni_horas(): void
    {
        $material = MaterialVariant::factory()->create();
        $this->actingAs(User::factory()->owner()->create())->postJson('/api/v1/cut-profiles', ['name' => 'Perfil ficticio', 'machineName' => 'Máquina ficticia', 'materialId' => $material->id, 'ratePerMeter' => '2.50', 'kerfMm' => null, 'spacingMm' => null])->assertSuccessful()->assertJsonPath('data.ratePerMeter', '2.5000')->assertJsonPath('data.kerfMm', null);
        $this->assertDatabaseHas('cut_profiles', ['rate_per_meter' => 2.5, 'kerf_mm' => null]);
    }

    public function test_borrador_no_acepta_precio_ni_aprobacion_del_navegador(): void
    {
        $this->actingAs(User::factory()->owner()->create())->postJson('/api/v1/drafts', ['title' => 'Trabajo de prueba', 'depthMm' => 50, 'billingMode' => 'proportional', 'price' => '0.01', 'status' => 'approved', 'analysis' => ['status' => 'geometry_valid']])->assertSuccessful()->assertJsonMissingPath('data.price')->assertJsonPath('data.analysis', null);
        $this->assertDatabaseHas('quote_drafts', ['status' => 'draft', 'title' => 'Trabajo de prueba']);
    }

    public function test_otro_propietario_no_puede_modificar_borrador_ajeno_404(): void
    {
        $draft = QuoteDraft::factory()->create();
        $this->actingAs(User::factory()->owner()->create())->putJson('/api/v1/drafts/'.$draft->id, ['title' => 'Cambio ajeno'])->assertNotFound();
        $this->assertDatabaseHas('quote_drafts', ['id' => $draft->id, 'title' => 'Borrador de prueba']);
    }

    public function test_asignacion_manual_requiere_motivo_422(): void
    {
        $this->actingAs(User::factory()->owner()->create())->postJson('/api/v1/drafts', ['title' => 'Prueba', 'depthMm' => 50, 'billingMode' => 'manual'])->assertUnprocessable()->assertJsonValidationErrors('notes');
    }

    public function test_fuente_svg_se_guarda_en_disco_privado_despues_del_analisis(): void
    {
        Storage::fake('local');
        Http::preventStrayRequests();
        $svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
        $hash = hash('sha256', $svg);
        Http::fake(['127.0.0.1:4100/analyze' => Http::response(['data' => ['version' => '1.0', 'sourceHash' => $hash, 'status' => 'review_required']], 200)]);
        $owner = User::factory()->owner()->create();
        $this->actingAs($owner)->postJson('/api/v1/designs/analyze', ['svg' => $svg, 'fileName' => 'fixture.svg'])->assertOk()->assertJsonPath('data.sourceHash', $hash);
        Storage::disk('local')->assertExists('designs/'.$owner->id.'/'.$hash.'.svg');
        $this->assertDatabaseCount('design_analyses', 1);
        Http::assertSentCount(1);
    }

    public function test_error_del_worker_no_aprueba_geometria_503(): void
    {
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:4100/analyze' => Http::failedConnection()]);
        $this->actingAs(User::factory()->owner()->create())->postJson('/api/v1/designs/analyze', ['svg' => '<svg/>', 'fileName' => 'fixture.svg'])->assertStatus(503)->assertJsonPath('message', 'El analizador no está disponible. Inicia el servicio geométrico y vuelve a cargar el archivo.');
        $this->assertDatabaseCount('design_analyses', 0);
        Http::assertSentCount(1);
    }

    public function test_credenciales_invalidas_no_abren_sesion_422(): void
    {
        $this->postJson('/api/v1/login', ['email' => 'nadie@example.test', 'password' => 'incorrecta'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_color_hex_del_material_se_conserva_en_catalogo(): void
    {
        $owner = User::factory()->owner()->create();
        $response = $this->actingAs($owner)->postJson('/api/v1/materials', [...$this->materialPayload(), 'colorHex' => '#235fb5']);
        $response->assertSuccessful()->assertJsonPath('data.colorHex', '#235fb5');
        $this->assertDatabaseHas('material_variants', ['id' => $response->json('data.id'), 'color_hex' => '#235fb5']);
        $this->postJson('/api/v1/materials', [...$this->materialPayload(), 'colorHex' => 'azul'])->assertUnprocessable()->assertJsonValidationErrors('colorHex');
    }

    private function materialPayload(): array
    {
        return ['name' => 'Material de prueba', 'family' => 'Acrílico', 'color' => 'Prueba', 'thicknessMm' => 3, 'widthMm' => 1200, 'heightMm' => 2400, 'directional' => false, 'purchasePrice' => null, 'marginMm' => null, 'supplier' => null];
    }
}
