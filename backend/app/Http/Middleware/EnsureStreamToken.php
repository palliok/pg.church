<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Пускает к изменению ссылки на трансляцию только с ключом из STREAM_API_TOKEN
 * (заголовок Authorization: Bearer …). Им пользуется Telegram-бот.
 */
class EnsureStreamToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) config('church.stream_token');

        abort_if($token === '', 403, 'Изменение ссылки на трансляцию отключено: не задан STREAM_API_TOKEN.');
        abort_unless(hash_equals($token, (string) $request->bearerToken()), 401, 'Неверный ключ доступа.');

        return $next($request);
    }
}
