<?php

namespace Tests\Feature\Api;

use App\Models\Song;
use App\Models\SongCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SongApiTest extends TestCase
{
    use RefreshDatabase;

    private SongCategory $worship;

    private SongCategory $hymns;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hymns = SongCategory::query()->create(['name' => 'Гимны', 'sort' => 2]);
        $this->worship = SongCategory::query()->create(['name' => 'Поклонение', 'sort' => 1]);

        Song::query()->create([
            'number' => 214, 'title' => 'Радость моя', 'song_category_id' => $this->hymns->id,
            'chordpro' => "Куплет 1\n[D]Свет Твой сияет во мне,\nИ ра[G]дость напол[A7]няет дом.",
        ]);
        Song::query()->create([
            'number' => 60, 'title' => 'Свят, свят, свят', 'song_category_id' => $this->worship->id, 'key' => 'E',
            'chordpro' => "Куплет 1\r\n\r\nСвят Господь Вседержитель,\r\nВся земля полна славы Твоей.\r\n\r\nПрипев\r\n\r\nТебе поём хвалу на 100%.",
        ]);
        Song::query()->create(['number' => 21, 'title' => 'Ты верен', 'chordpro' => null]);
    }

    public function test_index_lists_songs_by_number_without_lyrics(): void
    {
        $response = $this->getJson('/api/v1/songs');

        $response->assertOk()
            ->assertJsonPath('data.*.num', [21, 60, 214])
            ->assertJsonPath('data.1.title', 'Свят, свят, свят')
            ->assertJsonPath('data.1.category', 'Поклонение')
            ->assertJsonPath('data.1.categoryId', $this->worship->id)
            ->assertJsonPath('data.1.sub', 'Поклонение · тональность E')
            ->assertJsonPath('data.0.category', null)
            ->assertJsonPath('data.0.sub', '')
            ->assertJsonMissingPath('data.0.sections')
            ->assertJsonMissingPath('data.0.hasChords')
            ->assertJsonMissingPath('data.0.chordpro')
            ->assertJsonMissingPath('data.0.lyrics');
    }

    public function test_index_searches_by_title_lyric_line_and_number(): void
    {
        // Регистр не важен, в том числе для кириллицы.
        $this->getJson('/api/v1/songs?q=СВЯТ')->assertJsonPath('data.*.num', [60]);
        // Аккорды внутри слов («ра[G]дость напол[A7]няет») поиску не мешают.
        $this->getJson('/api/v1/songs?q=радость наполняет')->assertJsonPath('data.*.num', [214]);
        // А сами аккорды и заголовки секций в поиск не попадают.
        $this->getJson('/api/v1/songs?q=A7')->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?q=куплет')->assertJsonPath('data', []);
        // Номер ищется с начала: «21» находит и 21, и 214.
        $this->getJson('/api/v1/songs?q=21')->assertJsonPath('data.*.num', [21, 214]);
        $this->getJson('/api/v1/songs?q=14')->assertJsonPath('data.*.num', []);
        $this->getJson('/api/v1/songs?q=нет такой песни')->assertJsonPath('data', []);
    }

    public function test_index_shows_first_line_or_line_with_match(): void
    {
        $this->getJson('/api/v1/songs')
            ->assertJsonPath('data.*.line', [null, 'Свят Господь Вседержитель,', 'Свет Твой сияет во мне,']);

        // Строка с совпадением вместо первой; аккорды внутри слов не мешают.
        $this->getJson('/api/v1/songs?q=ЗЕМЛЯ')->assertJsonPath('data.0.line', 'Вся земля полна славы Твоей.');
        $this->getJson('/api/v1/songs?q=радость наполняет')->assertJsonPath('data.0.line', 'И радость наполняет дом.');
        // Нашлась по названию — первая строка.
        $this->getJson('/api/v1/songs?q=моя')->assertJsonPath('data.0.line', 'Свет Твой сияет во мне,');
    }

    public function test_search_treats_like_wildcards_literally(): void
    {
        $this->getJson('/api/v1/songs?q='.urlencode('%'))->assertJsonPath('data.*.num', [60]);
        $this->getJson('/api/v1/songs?q=_')->assertJsonPath('data', []);
    }

    public function test_index_filters_by_category(): void
    {
        $this->getJson("/api/v1/songs?category={$this->hymns->id}")->assertJsonPath('data.*.num', [214]);
        $this->getJson("/api/v1/songs?category={$this->worship->id}&q=радость")->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?category=abc')->assertUnprocessable()->assertJsonValidationErrors('category');
    }

    public function test_show_returns_song_text_as_sections(): void
    {
        $song = Song::query()->where('number', 60)->firstOrFail();

        $this->getJson("/api/v1/songs/{$song->id}")
            ->assertOk()
            ->assertJsonPath('data.num', 60)
            ->assertJsonPath('data.key', 'E')
            ->assertJsonPath('data.hasChords', false)
            ->assertJsonPath('data.sections', [
                ['type' => 'verse', 'label' => 'Куплет 1', 'lines' => [
                    [['chord' => null, 'text' => 'Свят Господь Вседержитель,']],
                    [['chord' => null, 'text' => 'Вся земля полна славы Твоей.']],
                ]],
                ['type' => 'chorus', 'label' => 'Припев', 'lines' => [
                    [['chord' => null, 'text' => 'Тебе поём хвалу на 100%.']],
                ]],
            ])
            ->assertJsonMissingPath('data.chordpro')
            ->assertJsonMissingPath('data.lyrics');

        $withChords = Song::query()->where('number', 214)->firstOrFail();

        $this->getJson("/api/v1/songs/{$withChords->id}")
            ->assertOk()
            ->assertJsonPath('data.hasChords', true)
            ->assertJsonPath('data.sections.0.lines.1', [
                ['chord' => null, 'text' => 'И ра'],
                ['chord' => 'G', 'text' => 'дость напол'],
                ['chord' => 'A7', 'text' => 'няет дом.'],
            ]);

        $withoutText = Song::query()->where('number', 21)->firstOrFail();

        $this->getJson("/api/v1/songs/{$withoutText->id}")
            ->assertOk()
            ->assertJsonPath('data.hasChords', false)
            ->assertJsonPath('data.sections', []);
        $this->getJson('/api/v1/songs/999999')->assertNotFound();
        $this->getJson('/api/v1/songs/abc')->assertNotFound();
    }

    public function test_categories_are_listed_in_sort_order(): void
    {
        $this->getJson('/api/v1/song-categories')
            ->assertOk()
            ->assertExactJson(['data' => [
                ['id' => $this->worship->id, 'name' => 'Поклонение'],
                ['id' => $this->hymns->id, 'name' => 'Гимны'],
            ]]);
    }
}
