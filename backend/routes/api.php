<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ChurchController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\SongController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Middleware\EnsureStreamToken;
use Illuminate\Support\Facades\Route;

// Публичный API для фронтенда (только чтение). Числовые идентификаторы ограничены
// диапазоном bigint, чтобы мусор в адресе давал 404, а не ошибку базы данных.
Route::prefix('v1')->where(array_fill_keys(['event', 'song', 'post', 'account'], '[0-9]{1,18}'))->group(function () {
    Route::get('church', ChurchController::class);
    Route::get('live', [StreamController::class, 'show']);
    Route::get('announcements', AnnouncementController::class);

    // Telegram-бот задаёт и убирает ссылки на трансляцию (ключ в STREAM_API_TOKEN).
    Route::middleware(['throttle:30,1', EnsureStreamToken::class])->group(function () {
        Route::post('stream', [StreamController::class, 'store']);
        Route::put('stream', [StreamController::class, 'update']);
        Route::delete('stream', [StreamController::class, 'destroy']);
    });

    Route::get('donation', [DonationController::class, 'index']);
    Route::get('donation/accounts/{account}/qr.svg', [DonationController::class, 'qr'])->name('api.donation.qr');

    Route::get('events', [EventController::class, 'index']);
    Route::get('events.ics', [CalendarController::class, 'feed'])->name('api.events.feed');
    Route::get('events/{event}.ics', [CalendarController::class, 'event'])->name('api.events.ics');
    Route::get('events/{event}', [EventController::class, 'show']);
    Route::get('events/{event}/sermon', [EventController::class, 'sermon']);

    Route::get('songs', [SongController::class, 'index']);
    Route::get('songs/{song}', [SongController::class, 'show']);
    Route::get('song-categories', [SongController::class, 'categories']);

    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/{post}', [PostController::class, 'show']);

    Route::get('stories', [StoryController::class, 'index']);
    Route::get('stories/{slug}', [StoryController::class, 'show']);
});
