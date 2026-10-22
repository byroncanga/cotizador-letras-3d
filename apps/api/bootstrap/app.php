<?php

use App\Http\Controllers\Api\V1\CostPreviewController;
use App\Http\Middleware\RequireOwner;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::post('/local/cost-preview', CostPreviewController::class)
                ->middleware(['web', 'auth:web', 'throttle:60,1'])
                ->name('local.cost-preview');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['owner' => RequireOwner::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*', 'local/*') || $request->expectsJson(),
        );
    })->create();
