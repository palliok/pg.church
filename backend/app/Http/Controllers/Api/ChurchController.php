<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DutyShift;
use App\Models\Setting;
use App\Support\RuDate;
use Illuminate\Http\JsonResponse;

class ChurchController extends Controller
{
    private const array SOCIAL = [
        'social_telegram' => ['code' => 'TG', 'label' => 'Telegram'],
        'social_youtube' => ['code' => 'YT', 'label' => 'YouTube'],
        'social_instagram' => ['code' => 'IG', 'label' => 'Instagram'],
    ];

    /**
     * Контакты церкви, дежурства служителей и состояние трансляции.
     */
    public function __invoke(): JsonResponse
    {
        $settings = Setting::values();
        $phone = $settings->get('church_phone');

        $social = collect(self::SOCIAL)
            ->map(fn (array $network, string $key) => [...$network, 'href' => $settings->get($key)])
            ->filter(fn (array $network) => filled($network['href']))
            ->values();

        $shifts = DutyShift::query()->with('minister')->orderBy('weekday')->orderBy('id')->get()
            ->map(fn (DutyShift $shift) => [
                'weekday' => $shift->weekday,
                'dow' => RuDate::WEEKDAYS_SHORT[$shift->weekday] ?? null,
                'name' => $shift->minister->name,
            ]);

        return response()->json(['data' => [
            'name' => $settings->get('church_name'),
            'city' => $settings->get('church_city'),
            'address' => $settings->get('church_address'),
            'metro' => $settings->get('church_metro'),
            'phone' => $phone,
            'phoneHref' => $phone ? 'tel:'.preg_replace('/[^\d+]/', '', $phone) : null,
            'social' => $social,
            'duty' => [
                'hours' => $settings->get('duty_hours'),
                'shifts' => $shifts,
            ],
            'live' => [
                'isLive' => (bool) $settings->get('stream_live'),
                'url' => $settings->get('stream_url'),
                'text' => $settings->get('stream_text'),
            ],
        ]]);
    }
}
