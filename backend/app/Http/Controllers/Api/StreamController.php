<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\StreamLinks;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Плашка «В эфире»: показывается, пока в настройках есть ссылки на трансляцию —
 * по одной на площадку (YouTube, VK Видео, Rutube…). Ссылки задают в админке
 * или Telegram-ботом через /api/v1/stream.
 */
class StreamController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = Setting::query()->whereIn('key', ['stream_links', 'stream_text'])->pluck('value', 'key');
        $links = StreamLinks::parse($settings->get('stream_links'));

        return response()->json(['data' => [
            'isLive' => $links !== [],
            'links' => $links,
            'text' => $links !== [] ? $settings->get('stream_text') : null,
        ]])->header('Cache-Control', 'public, max-age=15');
    }

    /**
     * Добавить ссылку: {"url": "https://…"}. Ссылка той же площадки заменяется.
     */
    public function store(Request $request): JsonResponse
    {
        $url = $request->validate(['url' => ['required', 'string', 'max:2000', 'url:http,https']])['url'];

        return $this->save($request, StreamLinks::with($this->setting()->value, $url));
    }

    /**
     * Заменить весь список: {"urls": ["https://…", …]}; пустой список убирает плашку.
     */
    public function update(Request $request): JsonResponse
    {
        $urls = $request->validate([
            'urls' => ['present', 'nullable', 'array', 'max:20'],
            'urls.*' => ['required', 'string', 'max:2000', 'url:http,https'],
        ])['urls'];

        return $this->save($request, $urls ?? []);
    }

    /**
     * Убрать все ссылки или только одной площадки: ?platform=youtube.
     */
    public function destroy(Request $request): JsonResponse
    {
        $platform = $request->validate(['platform' => ['nullable', 'string', 'max:100']])['platform'] ?? null;

        return $this->save($request, $platform ? StreamLinks::without($this->setting()->value, $platform) : []);
    }

    /**
     * @param  list<string>  $urls
     */
    private function save(Request $request, array $urls): JsonResponse
    {
        $value = StreamLinks::serialize($urls);
        $this->setting()->update(['value' => $value]);

        Log::info('Ссылки на трансляцию изменены через API', ['links' => $value, 'ip' => $request->ip()]);

        return $this->show()->header('Cache-Control', 'no-store');
    }

    private function setting(): Setting
    {
        $setting = Setting::query()->where('key', 'stream_links')->first();

        abort_if($setting === null, 500, 'Настройки сайта не созданы: выполните php artisan db:seed --class=SettingSeeder.');

        return $setting;
    }
}
