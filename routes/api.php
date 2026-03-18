<?php

use App\Http\Controllers\Api\AuthSignoutController;
use App\Http\Controllers\Api\AuthStatusController;
use App\Http\Controllers\Api\AssistantBootstrapController;
use App\Http\Controllers\Api\AssistantGuestRespondController;
use App\Http\Controllers\Api\AssistantHistoryController;
use App\Http\Controllers\Api\AssistantMessageController;
use App\Http\Controllers\Api\AssistantNewConversationController;
use App\Http\Controllers\Api\ArticleReminderController;
use App\Http\Controllers\Api\ArticleSaveController;
use App\Http\Controllers\Api\DebugAssistantController;
use App\Http\Controllers\Api\JournalEntryApiController;
use App\Http\Controllers\Api\JournalDeleteController;
use App\Http\Controllers\Api\JournalMetaController;
use App\Http\Controllers\Api\NotificationActionController;
use App\Http\Controllers\Api\NotificationBootstrapController;
use App\Http\Controllers\Api\NotificationReadAllController;
use App\Http\Controllers\Api\NotificationReadController;
use App\Http\Controllers\Api\ProfileApiController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/auth/status', AuthStatusController::class);
    Route::post('/auth/signout', AuthSignoutController::class);
    Route::get('/assistant/bootstrap', AssistantBootstrapController::class);
    Route::get('/assistant/history', AssistantHistoryController::class);
    Route::post('/assistant/messages', AssistantMessageController::class);
    Route::post('/assistant/new-conversation', AssistantNewConversationController::class);
    Route::post('/assistant/guest/respond', AssistantGuestRespondController::class);
    Route::get('/debug/assistant', DebugAssistantController::class);
    Route::get('/journal/meta', JournalMetaController::class);
    Route::post('/journal/entries', [JournalEntryApiController::class, 'store']);
    Route::post('/journal/quick', [JournalEntryApiController::class, 'quick']);
    Route::delete('/journal/delete', JournalDeleteController::class);
    Route::get('/profile', [ProfileApiController::class, 'show']);
    Route::put('/profile', [ProfileApiController::class, 'update']);
    Route::get('/notifications/bootstrap', NotificationBootstrapController::class);
    Route::post('/notifications/read', NotificationReadController::class);
    Route::post('/notifications/read-all', NotificationReadAllController::class);
    Route::post('/notifications/{notificationId}/action', NotificationActionController::class);
    Route::post('/articles/{articleId}/save', [ArticleSaveController::class, 'store']);
    Route::delete('/articles/{articleId}/save', [ArticleSaveController::class, 'destroy']);
    Route::post('/articles/{articleId}/reminder', [ArticleReminderController::class, 'store']);
    Route::delete('/articles/{articleId}/reminder', [ArticleReminderController::class, 'destroy']);
});
