<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Синхронизация внешних календарей; нужен запущенный планировщик (сервис scheduler в docker-compose).
Schedule::command('calendars:sync')->everyFifteenMinutes()->withoutOverlapping();
