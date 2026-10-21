<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CutProfileRequest;
use App\Http\Requests\MaterialRequest;
use App\Http\Resources\CutProfileResource;
use App\Http\Resources\MaterialResource;
use App\Models\AuditEvent;
use App\Models\CutProfile;
use App\Models\Machine;
use App\Models\MaterialVariant;
use App\Models\StockPresentation;
use App\Models\Supplier;
use App\Models\SupplierPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    public function materials(): AnonymousResourceCollection
    {
        return MaterialResource::collection(MaterialVariant::with('presentations')->orderBy('name')->paginate(50));
    }

    public function storeMaterial(MaterialRequest $request): MaterialResource
    {
        return $this->writeMaterial($request, new MaterialVariant);
    }

    public function updateMaterial(MaterialRequest $request, MaterialVariant $material): MaterialResource
    {
        return $this->writeMaterial($request, $material);
    }

    private function writeMaterial(MaterialRequest $request, MaterialVariant $material): MaterialResource
    {
        return DB::transaction(function () use ($request, $material): MaterialResource {
            $data = $request->validated();
            if ($material->exists) {
                $material = MaterialVariant::whereKey($material->id)->lockForUpdate()->firstOrFail();
            }
            $material->fill(['name' => $data['name'], 'family' => $data['family'], 'color' => $data['color'], 'color_hex' => $data['colorHex'] ?? $material->color_hex, 'thickness_mm' => $data['thicknessMm'], 'directional' => $data['directional']]);
            $material->save();
            $presentation = $material->presentations()->first() ?? new StockPresentation(['material_variant_id' => $material->id]);
            $oldPrice = $presentation->purchase_price;
            $oldSupplier = $presentation->supplier_id;
            $presentation->fill(['width_mm' => $data['widthMm'], 'height_mm' => $data['heightMm'], 'margin_mm' => $data['marginMm'] ?? null, 'purchase_price' => $data['purchasePrice'] ?? null, 'supplier_id' => $data['supplier'] ?? null]);
            $presentation->save();
            if ($presentation->purchase_price !== null && ($oldPrice !== $presentation->purchase_price || $oldSupplier !== $presentation->supplier_id)) {
                SupplierPrice::create(['stock_presentation_id' => $presentation->id, 'supplier_id' => $presentation->supplier_id, 'price' => $presentation->purchase_price, 'effective_at' => now()]);
            }
            $this->audit($request, 'material.saved', $material->id, $data);

            return new MaterialResource($material->load('presentations'));
        });
    }

    public function suppliers(): JsonResponse
    {
        $suppliers = Supplier::orderBy('name')->get()->map(fn (Supplier $s): array => ['id' => $s->id, 'name' => $s->name, 'contact' => $s->contact ?? '', 'email' => $s->email ?? '', 'phone' => $s->phone ?? '', 'notes' => $s->notes ?? '', 'updatedAt' => $s->updated_at->toISOString()]);

        return response()->json(['data' => $suppliers]);
    }

    public function storeSupplier(Request $request): JsonResponse
    {
        return $this->writeSupplier($request, new Supplier);
    }

    public function updateSupplier(Request $request, Supplier $supplier): JsonResponse
    {
        return $this->writeSupplier($request, $supplier);
    }

    private function writeSupplier(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:180'], 'contact' => ['nullable', 'string', 'max:180'], 'email' => ['nullable', 'email', 'max:180'], 'phone' => ['nullable', 'string', 'max:60'], 'notes' => ['nullable', 'string', 'max:5000']]);

        return DB::transaction(function () use ($request, $supplier, $data): JsonResponse {
            $supplier->fill($data)->save();
            $this->audit($request, 'supplier.saved', $supplier->id, $data);

            return response()->json(['data' => ['id' => $supplier->id, 'name' => $supplier->name, 'contact' => $supplier->contact ?? '', 'email' => $supplier->email ?? '', 'phone' => $supplier->phone ?? '', 'notes' => $supplier->notes ?? '', 'updatedAt' => $supplier->updated_at->toISOString()]]);
        });
    }

    public function profiles(): AnonymousResourceCollection
    {
        return CutProfileResource::collection(CutProfile::with('machine')->orderBy('name')->paginate(50));
    }

    public function storeProfile(CutProfileRequest $request): CutProfileResource
    {
        return $this->writeProfile($request, new CutProfile);
    }

    public function updateProfile(CutProfileRequest $request, CutProfile $profile): CutProfileResource
    {
        return $this->writeProfile($request, $profile);
    }

    private function writeProfile(CutProfileRequest $request, CutProfile $profile): CutProfileResource
    {
        return DB::transaction(function () use ($request, $profile): CutProfileResource {
            $data = $request->validated();
            $machine = Machine::firstOrCreate(['name' => $data['machineName']]);
            $profile->fill(['name' => $data['name'], 'machine_id' => $machine->id, 'material_variant_id' => $data['materialId'] ?? null, 'kerf_mm' => $data['kerfMm'] ?? null, 'spacing_mm' => $data['spacingMm'] ?? null, 'rate_per_meter' => $data['ratePerMeter'] ?? null, 'setup_cost' => $data['setupCost'] ?? null, 'minimum_cost' => $data['minimumCost'] ?? null, 'calibrated_on' => $data['calibratedOn'] ?? null]);
            $profile->save();
            $this->audit($request, 'cut_profile.saved', $profile->id, $data);

            return new CutProfileResource($profile->load('machine'));
        });
    }

    private function audit(Request $request, string $action, string $id, array $changes): void
    {
        AuditEvent::create(['user_id' => $request->user()->id, 'action' => $action, 'entity_type' => strtok($action, '.'), 'entity_id' => $id, 'changes' => $changes]);
    }
}
