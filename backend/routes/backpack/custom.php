<?php

use Illuminate\Support\Facades\Route;

// --------------------------
// Custom Backpack Routes
// --------------------------
// This route file is loaded automatically by Backpack\CRUD.
// Routes you generate using Backpack\Generators will be placed here.

Route::group([
    'prefix' => config('backpack.base.route_prefix', 'admin'),
    'middleware' => array_merge(
        (array) config('backpack.base.web_middleware', 'web'),
        (array) config('backpack.base.middleware_key', 'admin')
    ),
    'namespace' => 'App\Http\Controllers\Admin',
], function () { // custom admin routes
    Route::crud('event', 'EventCrudController');
    Route::crud('calendar-source', 'CalendarSourceCrudController');
    Route::post('calendar-source/{id}/sync', 'CalendarSourceCrudController@sync')->whereNumber('id')->name('calendar-source.sync');
    Route::crud('sermon', 'SermonCrudController');
    Route::crud('minister', 'MinisterCrudController');
    Route::crud('duty-shift', 'DutyShiftCrudController');
    Route::crud('song', 'SongCrudController');
    Route::crud('song-category', 'SongCategoryCrudController');
    Route::crud('post', 'PostCrudController');
    Route::crud('tag', 'TagCrudController');
    Route::crud('story', 'StoryCrudController');
    Route::crud('story-panel', 'StoryPanelCrudController');
    Route::crud('donation-target', 'DonationTargetCrudController');
    Route::crud('donation-account', 'DonationAccountCrudController');
    Route::crud('setting', 'SettingCrudController');
    Route::crud('user', 'UserCrudController');
}); // this should be the absolute last line of this file

/**
 * DO NOT ADD ANYTHING HERE.
 */
