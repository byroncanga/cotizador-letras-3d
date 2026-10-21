<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Costing\QuoteCostCalculator;
use App\Http\Controllers\Controller;
use App\Http\Requests\CostPreviewRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CostPreviewController extends Controller
{
    public function __invoke(CostPreviewRequest $request, QuoteCostCalculator $calculator): JsonResponse
    {
        try {
            return response()->json(['data' => $calculator->calculate($request->validated())])->header('Cache-Control', 'no-store');
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['costs' => $exception->getMessage()]);
        }
    }
}
