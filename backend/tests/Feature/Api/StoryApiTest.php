<?php

namespace Tests\Feature\Api;

use App\Models\Story;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $easter = Story::query()->create(['slug' => 'easter', 'kicker' => 'Пасха', 'title' => 'Что такое Пасха?', 'cover_scene' => 'tomb', 'sort' => 2]);
        $easter->panels()->create(['sort' => 2, 'scene' => 'tomb', 'tag' => 'Воскресенье', 'title' => 'Гробница пуста', 'text' => 'Он воскрес!']);
        $easter->panels()->create(['sort' => 1, 'scene' => 'city', 'tag' => 'Вход', 'title' => 'Царь на ослёнке', 'text' => 'Осанна!']);

        Story::query()->create(['slug' => 'jesus', 'kicker' => 'Евангелие', 'title' => 'Кто такой Иисус?', 'lead' => 'В картинках.', 'cover_scene' => 'dawn', 'background' => 'linear-gradient(135deg,#000,#fff)', 'sort' => 1]);
        Story::query()->create(['slug' => 'draft', 'kicker' => 'Черновик', 'title' => 'Не готово', 'cover_scene' => 'dawn', 'sort' => 0, 'is_published' => false]);
    }

    public function test_index_lists_published_stories_without_panels(): void
    {
        $this->getJson('/api/v1/stories')
            ->assertOk()
            ->assertJsonPath('data.*.slug', ['jesus', 'easter'])
            ->assertJsonPath('data.0.kicker', 'Евангелие')
            ->assertJsonPath('data.0.lead', 'В картинках.')
            ->assertJsonPath('data.0.cover', 'dawn')
            ->assertJsonPath('data.0.bg', 'linear-gradient(135deg,#000,#fff)')
            ->assertJsonMissingPath('data.0.panels');
    }

    public function test_show_returns_story_with_panels_in_order(): void
    {
        $this->getJson('/api/v1/stories/easter')
            ->assertOk()
            ->assertJsonPath('data.title', 'Что такое Пасха?')
            ->assertJsonPath('data.panels', [
                ['scene' => 'city', 'tag' => 'Вход', 'title' => 'Царь на ослёнке', 'text' => 'Осанна!'],
                ['scene' => 'tomb', 'tag' => 'Воскресенье', 'title' => 'Гробница пуста', 'text' => 'Он воскрес!'],
            ]);
    }

    public function test_show_hides_unpublished_and_unknown_stories(): void
    {
        $this->getJson('/api/v1/stories/draft')->assertNotFound();
        $this->getJson('/api/v1/stories/unknown')->assertNotFound();
    }
}
