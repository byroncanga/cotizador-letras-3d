<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\DesignAnalysisController;
use App\Http\Controllers\Api\V1\QuoteDraftController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('health', fn () => response()->json(['status' => 'ok', 'version' => '1.0', 'database' => config('database.default')]))->name('api.health');
    Route::post('login', [AuthController::class, 'login'])->middleware(['web', 'throttle:5,1'])->name('api.login');
    Route::get('setup/status', [AuthController::class, 'setupStatus'])->name('api.setup.status');
    Route::post('setup/owner', [AuthController::class, 'createInitialOwner'])->middleware(['web', 'throttle:3,1'])->name('api.setup.owner');
    Route::middleware(['web', 'auth:web'])->group(function (): void {
        Route::get('me', [AuthController::class, 'me'])->name('api.me');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('web')->name('api.logout');
        Route::middleware('owner')->group(function (): void {
            Route::get('users', [AuthController::class, 'users']);
            Route::post('users', [AuthController::class, 'createUser']);
        });
        Route::get('materials', [CatalogController::class, 'materials']);
        Route::post('materials', [CatalogController::class, 'storeMaterial']);
        Route::put('materials/{material}', [CatalogController::class, 'updateMaterial']);
        Route::get('suppliers', [CatalogController::class, 'suppliers']);
        Route::post('suppliers', [CatalogController::class, 'storeSupplier']);
        Route::put('suppliers/{supplier}', [CatalogController::class, 'updateSupplier']);
        Route::get('cut-profiles', [CatalogController::class, 'profiles']);
        Route::post('cut-profiles', [CatalogController::class, 'storeProfile']);
        Route::put('cut-profiles/{profile}', [CatalogController::class, 'updateProfile']);
        Route::post('designs/analyze', DesignAnalysisController::class)->middleware('throttle:12,1');
        Route::get('drafts', [QuoteDraftController::class, 'index']);
        Route::post('drafts', [QuoteDraftController::class, 'store']);
        Route::put('drafts/{draft}', [QuoteDraftController::class, 'update']);
    });
});
