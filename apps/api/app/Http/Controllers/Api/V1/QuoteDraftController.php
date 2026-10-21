<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuoteDraftResource;
use App\Models\DesignAnalysis;
use App\Models\QuoteDraft;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class QuoteDraftController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return QuoteDraftResource::collection(QuoteDraft::with('analysis')->where('user_id', $request->user()->id)->latest('updated_at')->paginate(50));
    }

    public function store(Request $request): QuoteDraftResource
    {
        $draft = new QuoteDraft(['user_id' => $request->user()->id, 'number' => 'BOR-'.strtoupper(substr((string) Str::uuid(), 0, 8))]);

        return $this->write($request, $draft);
    }

    public function update(Request $request, QuoteDraft $draft): QuoteDraftResource
    {
        abort_unless($draft->user_id === $request->user()->id, 404);

        return $this->write($request, $draft);
    }

    private function write(Request $request, QuoteDraft $draft): QuoteDraftResource
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:180'], 'customer' => ['nullable', 'string', 'max:180'], 'depthMm' => ['required', 'numeric', 'gt:0', 'max:10000'],
            'frontMaterialId' => ['nullable', 'uuid', 'exists:material_variants,id'], 'backMaterialId' => ['nullable', 'uuid', 'exists:material_variants,id'], 'edgeMaterialId' => ['nullable', 'uuid', 'exists:material_variants,id'],
            'billingMode' => ['required', 'in:proportional,full_sheet,manual'], 'notes' => ['nullable', 'string', 'max:5000', Rule::requiredIf($request->input('billingMode') === 'manual')],
            'analysisId' => ['nullable', 'uuid', Rule::exists(DesignAnalysis::class, 'id')->where('user_id', $request->user()->id)]]);
        $draft->fill(['title' => $data['title'], 'customer_name' => $data['customer'] ?? null, 'depth_mm' => $data['depthMm'], 'front_material_id' => $data['frontMaterialId'] ?? null, 'back_material_id' => $data['backMaterialId'] ?? null, 'edge_material_id' => $data['edgeMaterialId'] ?? null, 'billing_mode' => $data['billingMode'], 'notes' => $data['notes'] ?? null, 'design_analysis_id' => $data['analysisId'] ?? null, 'status' => 'draft']);
        $draft->save();

        return new QuoteDraftResource($draft->load('analysis'));
    }
}
