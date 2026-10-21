<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['application' => 'Taller API', 'version' => '1.0']));
