<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Contractor\StripeController;
use App\Http\Controllers\Api\TenderController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ContractorController;
use App\Http\Controllers\Api\PdfExtractionController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/test-upload', function(\Illuminate\Http\Request $request) {
    if (!$request->hasFile('file')) return response()->json(['error' => 'No file'], 400);
    $path = $request->file('file')->store('test', 'public');
    return response()->json(['url' => \Illuminate\Support\Facades\Storage::url($path)]);
});

// Stripe webhook (no auth, verified by signature)
Route::post('/stripe/webhook', [StripeController::class, 'webhook']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Profile Management
    Route::get('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
    Route::put('/profile/password', [\App\Http\Controllers\Api\ProfileController::class, 'changePassword']);
    Route::post('/profile/avatar', [\App\Http\Controllers\Api\ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/documents', [\App\Http\Controllers\Api\ProfileController::class, 'uploadDocument']);
    
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // Tenders - Public read for authenticated users
    Route::get('/tenders', [TenderController::class, 'index']);
    Route::get('/tenders/{id}', [TenderController::class, 'show']);
    
    // Admin Routes
    Route::middleware('admin')->group(function () {
        // Admin Dashboard
        Route::get('/admin/dashboard', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'index']);
        
        // Tender Management
        Route::post('/tenders', [TenderController::class, 'store']);
        Route::put('/tenders/{id}', [TenderController::class, 'update']);
        Route::delete('/tenders/{id}', [TenderController::class, 'destroy']);
        Route::post('/tenders/{id}/publish', [TenderController::class, 'publish']);
        Route::put('/tenders/{id}/boq-items', [TenderController::class, 'updateBoqItems']);
        
        // Bid Management
        Route::post('/bids/{id}/award', [BidController::class, 'award']);
        
        // Document Management
        Route::get('/documents', [DocumentController::class, 'adminIndex']);
        Route::post('/documents', [DocumentController::class, 'store']);
        Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
        
        // Contractor Management
        Route::get('/contractors', [ContractorController::class, 'index']);
        Route::get('/contractors/{id}', [ContractorController::class, 'show']);
        Route::get('/contractors/{id}/statistics', [ContractorController::class, 'statistics']);
        
        // PDF Extraction
        Route::post('/tenders/{id}/extract-pdf', [PdfExtractionController::class, 'uploadAndExtract']);
        Route::post('/extract-pdf', [PdfExtractionController::class, 'uploadAndExtract']);
        Route::get('/extractions/{id}', [PdfExtractionController::class, 'getStatus']);
        Route::get('/tenders/{id}/extractions', [PdfExtractionController::class, 'getTenderExtractions']);
    });
    
    // Contractor Routes
    Route::middleware('contractor')->group(function () {
        Route::get('/contractor/dashboard', [\App\Http\Controllers\Api\Contractor\DashboardController::class, 'index']);
        Route::post('/tenders/{id}/bids', [BidController::class, 'store']);
        Route::get('/my-bids', [BidController::class, 'myBids']);
        Route::post('/bids/{id}/submit', [BidController::class, 'submit']);
        
        // Billing & Credits
        Route::get('/billing', [\App\Http\Controllers\Api\Contractor\BillingController::class, 'index']);
        Route::post('/billing/purchase', [\App\Http\Controllers\Api\Contractor\BillingController::class, 'purchaseCredits']);

        // Stripe
        Route::post('/stripe/checkout', [StripeController::class, 'createCheckoutSession']);
        Route::get('/stripe/verify', [StripeController::class, 'verifySession']);
        
        // Saved Tenders
        Route::post('/tenders/{id}/save', [TenderController::class, 'save']);
        Route::delete('/tenders/{id}/save', [TenderController::class, 'unsave']);
        Route::post('/tenders/{id}/unlock', [TenderController::class, 'unlock']);

        // Document History
        Route::get('/contractor/documents', [DocumentController::class, 'history']);

        // AI Scan
        Route::post('/contractor/ai-scan', [\App\Http\Controllers\Api\Contractor\AiScanController::class, 'scan']);
    });

    // Owner Routes
    Route::middleware('owner')->group(function () {
        // User Management
        Route::get('/owner/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::put('/owner/users/{id}/status', [\App\Http\Controllers\Api\UserController::class, 'updateStatus']);
        Route::put('/owner/users/{id}/verify', [\App\Http\Controllers\Api\UserController::class, 'verify']);
        Route::get('/owner/statistics', [\App\Http\Controllers\Api\UserController::class, 'statistics']);
        
        // Owner Dashboard & Analytics
        Route::get('/owner/dashboard', [\App\Http\Controllers\Api\Owner\DashboardController::class, 'index']);
        Route::get('/owner/revenue', [\App\Http\Controllers\Api\Owner\DashboardController::class, 'revenue']);
        Route::get('/owner/transactions', [\App\Http\Controllers\Api\Owner\DashboardController::class, 'transactions']);

        // Audit Logs
        Route::get('/owner/audit-logs', [\App\Http\Controllers\Api\Owner\AuditLogController::class, 'index']);

        // System Config
        Route::get('/owner/config', [\App\Http\Controllers\Api\Owner\SystemConfigController::class, 'index']);
        Route::post('/owner/config', [\App\Http\Controllers\Api\Owner\SystemConfigController::class, 'update']);

        // User Management
        Route::get('/owner/users/{id}', [\App\Http\Controllers\Api\Owner\UserController::class, 'show']);
        Route::put('/owner/users/{id}/suspend', [\App\Http\Controllers\Api\Owner\UserController::class, 'suspend']);
        Route::put('/owner/users/{id}/activate', [\App\Http\Controllers\Api\Owner\UserController::class, 'activate']);
        Route::delete('/owner/users/{id}', [\App\Http\Controllers\Api\Owner\UserController::class, 'destroy']);

        // Notification Templates
        Route::get('/owner/notifications', [\App\Http\Controllers\Api\Owner\NotificationTemplateController::class, 'index']);
        Route::put('/owner/notifications/{id}', [\App\Http\Controllers\Api\Owner\NotificationTemplateController::class, 'update']);
    });

    // Shared Routes (with internal authorization checks)
    Route::get('/tenders/{id}/bids', [BidController::class, 'forTender']);
    Route::get('/bids/{id}', [BidController::class, 'show']);
    Route::get('/tenders/{id}/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
});
