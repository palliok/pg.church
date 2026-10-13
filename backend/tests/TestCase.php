<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Тесты не ходят в сеть: без этого Backpack Basset пытается скачивать
        // ассеты админки с CDN прямо во время рендера страниц.
        Http::preventStrayRequests();
    }
}
