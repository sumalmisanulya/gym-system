<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\MemberController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication Route
Route::post('/login', [AuthController::class, 'login']);

// Authenticated Routes Protected by Laravel Sanctum
Route::middleware('auth:sanctum')->group(function () {
    
    // Revoke Token
    Route::post('/logout', [AuthController::class, 'logout']);

    // Front-Desk Desk Operations (Admin & Staff Only)
    Route::middleware('role:admin,staff')->group(function () {
        Route::get('/members', [MemberController::class, 'index']);
        Route::post('/members/{id}/check-in', [CheckInController::class, 'store']);
        Route::get('/check-ins', [CheckInController::class, 'index']);
    });

    // Administrative Operations (Admin Only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/members', [MemberController::class, 'store']);
        Route::put('/members/{id}', [MemberController::class, 'update']);
    });

    // Member Personal Actions (Member Only)
    Route::middleware('role:member')->group(function () {
        Route::get('/member/dashboard', [MemberController::class, 'dashboard']);
    });
});
