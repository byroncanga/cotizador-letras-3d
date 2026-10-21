<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DesignAnalysis;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DesignAnalysisController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $input = $request->validate(['svg' => ['required', 'string', 'max:2000000'], 'fileName' => ['required', 'string', 'max:200'], 'confirmedWidthMm' => ['nullable', 'numeric', 'gt:0', 'max:100000'], 'operations' => ['sometimes', 'array', 'max:300'], 'operations.*' => ['required', 'in:cut,engrave,mark,unassigned']]);
        try {
            $response = Http::connectTimeout(2)->timeout(10)->post(rtrim(config('geometry.url'), '/').'/analyze', $input);
        } catch (ConnectionException $exception) {
            report($exception);

            return response()->json(['message' => 'El analizador no está disponible. Inicia el servicio geométrico y vuelve a cargar el archivo.'], 503);
        }
        if (! $response->successful()) {
            throw ValidationException::withMessages(['svg' => $response->json('message') ?: 'No se pudo analizar el SVG.']);
        }
        $analysis = $response->json('data');
        if (! is_array($analysis) || ($analysis['version'] ?? '') !== '1.0' || ($analysis['sourceHash'] ?? '') !== hash('sha256', $input['svg'])) {
            return response()->json(['message' => 'El resultado geométrico no cumple el contrato. Vuelve a analizar el archivo.'], 502);
        }
        $path = 'designs/'.$request->user()->id.'/'.$analysis['sourceHash'].'.svg';
        Storage::disk('local')->put($path, $input['svg']);
        $record = DesignAnalysis::create(['user_id' => $request->user()->id, 'source_hash' => $analysis['sourceHash'], 'file_name' => $input['fileName'], 'source_path' => $path, 'normalized' => $analysis]);

        return response()->json(['data' => $analysis, 'meta' => ['analysisId' => $record->id]]);
    }
}
