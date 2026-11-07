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

        Song::query()->create(['number' => 214, 'title' => 'Радость моя', 'song_category_id' => $this->hymns->id])->variants()->create([
            'letter' => 'а', 'is_default' => true,
            'chordpro' => "Куплет 1\n[D]Свет Твой сияет во мне,\nИ ра[G]дость напол[A7]няет дом.",
        ]);
        Song::query()->create(['number' => 60, 'title' => 'Свят, свят, свят', 'song_category_id' => $this->worship->id])->variants()->createMany([
            [
                'letter' => 'а', 'label' => 'PG music', 'key' => 'G',
                'capo' => 2, 'composer' => 'Джон Дайкс', 'lyricist' => 'Иван Проханов', 'artist' => 'Хор церкви',
                'chordpro' => "Свят, свят, свят Господь,\nНебо и земля полны славы Твоей.",
            ],
            [
                'letter' => 'б', 'label' => '3 хор', 'is_default' => true, 'key' => 'E',
                'chordpro' => "Куплет 1\r\n\r\nСвят Господь Вседержитель,\r\nВся земля полна славы Твоей.\r\n\r\nПрипев\r\n\r\nТебе поём хвалу на 100%.",
            ],
        ]);
        Song::query()->create(['number' => 21, 'title' => 'Ты верен'])->variants()->create(['letter' => 'а', 'chordpro' => null]);
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
            ->assertJsonMissingPath('data.0.variants')
            ->assertJsonMissingPath('data.0.variant')
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

    public function test_search_looks_into_all_variants_and_names_the_matching_one(): void
    {
        // Строка есть только в варианте «а», основной — «б»: песня одна, с буквой найденного варианта.
        $this->getJson('/api/v1/songs?q=небо')
            ->assertJsonPath('data.*.num', [60])
            ->assertJsonPath('data.0.line', 'Небо и земля полны славы Твоей.')
            ->assertJsonPath('data.0.variant', 'а');

        // Строка есть в обоих вариантах — показывается основной, буква не нужна.
        $this->getJson('/api/v1/songs?q=земля')
            ->assertJsonPath('data.*.num', [60])
            ->assertJsonPath('data.0.line', 'Вся земля полна славы Твоей.')
            ->assertJsonPath('data.0.variant', null);
    }

    public function test_search_by_number_with_variant_letter(): void
    {
        $this->getJson('/api/v1/songs?q=60б')
            ->assertJsonPath('data.*.num', [60])
            ->assertJsonPath('data.0.variant', 'б')
            ->assertJsonPath('data.0.line', 'Свят Господь Вседержитель,');
        // Пробел и заглавная буква не мешают; строка — из найденного варианта.
        $this->getJson('/api/v1/songs?q='.urlencode('60 А'))
            ->assertJsonPath('data.*.num', [60])
            ->assertJsonPath('data.0.variant', 'а')
            ->assertJsonPath('data.0.line', 'Свят, свят, свят Господь,');
        // Такой буквы у песни нет.
        $this->getJson('/api/v1/songs?q=60в')->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?q=214б')->assertJsonPath('data', []);
    }

    public function test_search_ignores_punctuation_yo_and_word_order(): void
    {
        // «Свят, свят» в тексте, «Твоей.» с точкой, «поём» через «е».
        $this->getJson('/api/v1/songs?q='.urlencode('свят господь'))->assertJsonPath('data.*.num', [60]);
        $this->getJson('/api/v1/songs?q='.urlencode('славы твоей земля'))->assertJsonPath('data.*.num', [60]);
        $this->getJson('/api/v1/songs?q='.urlencode('Тебе поем хвалу'))
            ->assertJsonPath('data.*.num', [60])
            ->assertJsonPath('data.0.line', 'Тебе поём хвалу на 100%.');
        // Все слова — в одном варианте: «небо» есть только в «а», «вседержитель» — только в «б».
        $this->getJson('/api/v1/songs?q='.urlencode('небо вседержитель'))->assertJsonPath('data', []);
        // Запрос из одних знаков ничего не находит, а не всё подряд.
        $this->getJson('/api/v1/songs?q='.urlencode('%'))->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?q=_')->assertJsonPath('data', []);
    }

    public function test_search_matches_from_word_start(): void
    {
        Song::query()->create(['number' => 7, 'title' => 'Суверенный Бог']);

        // «верен» — начало слова в «Ты верен», но не в «Суверенный»; «рад» — начало «радость».
        $this->getJson('/api/v1/songs?q=верен')->assertJsonPath('data.*.num', [21]);
        $this->getJson('/api/v1/songs?q=рад')->assertJsonPath('data.*.num', [214]);
    }

    public function test_search_ranks_title_and_phrase_above_scattered_words(): void
    {
        Song::query()->create(['number' => 5, 'title' => 'Хвала'])->variants()->create([
            'letter' => 'а', 'is_default' => true, 'chordpro' => "Радость в доме моём,\nСвет над нами горит.",
        ]);
        Song::query()->create(['number' => 6, 'title' => 'Утро'])->variants()->create([
            'letter' => 'а', 'is_default' => true, 'chordpro' => 'Свет Твой сияет над нами.',
        ]);

        // Название целиком, потом слова подряд в тексте, потом вразбивку; внутри — по номеру.
        $this->getJson('/api/v1/songs?q=радость')->assertJsonPath('data.*.num', [214, 5]);
        $this->getJson('/api/v1/songs?q='.urlencode('свет твой'))->assertJsonPath('data.*.num', [6, 214]);
        $this->getJson('/api/v1/songs?q='.urlencode('свет нами'))->assertJsonPath('data.*.num', [5, 6]);
    }

    public function test_search_tolerates_typos_only_when_nothing_found(): void
    {
        // Опечатка: «сеяет», «наполнят» — песня находится, строка с совпадением подобрана.
        $this->getJson('/api/v1/songs?q='.urlencode('сеяет'))
            ->assertJsonPath('data.*.num', [214])
            ->assertJsonPath('data.0.line', 'Свет Твой сияет во мне,');
        $this->getJson('/api/v1/songs?q='.urlencode('радасть наполнят'))
            ->assertJsonPath('data.*.num', [214])
            ->assertJsonPath('data.0.line', 'И радость наполняет дом.');
        // Опечатка в названии — и песня без текста находится.
        $this->getJson('/api/v1/songs?q='.urlencode('Ты верин'))->assertJsonPath('data.*.num', [21]);
        // Две ошибки в коротком слове — уже не похоже; короткие слова с опечатками не ищутся.
        $this->getJson('/api/v1/songs?q='.urlencode('сеаят'))->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?q='.urlencode('дем'))->assertJsonPath('data', []);
        // Если точное совпадение есть, похожие слова не подмешиваются: «свят» не находит «свет».
        $this->getJson('/api/v1/songs?q=свят')->assertJsonPath('data.*.num', [60]);
    }

    public function test_index_filters_by_category(): void
    {
        $this->getJson("/api/v1/songs?category={$this->hymns->id}")->assertJsonPath('data.*.num', [214]);
        $this->getJson("/api/v1/songs?category={$this->worship->id}&q=радость")->assertJsonPath('data', []);
        $this->getJson('/api/v1/songs?category=abc')->assertUnprocessable()->assertJsonValidationErrors('category');
    }

    public function test_show_returns_variants_with_default_first(): void
    {
        $song = Song::query()->where('number', 60)->firstOrFail();

        $this->getJson("/api/v1/songs/{$song->id}")
            ->assertOk()
            ->assertJsonPath('data.num', 60)
            ->assertJsonPath('data.key', 'E')
            ->assertJsonPath('data.sub', 'Поклонение · тональность E')
            ->assertJsonPath('data.variants.*.letter', ['б', 'а'])
            ->assertJsonPath('data.variants.*.label', ['3 хор', 'PG music'])
            ->assertJsonPath('data.variants.*.isDefault', [true, false])
            ->assertJsonPath('data.variants.*.key', ['E', 'G'])
            ->assertJsonPath('data.variants.*.capo', [null, 2])
            ->assertJsonPath('data.variants.1.composer', 'Джон Дайкс')
            ->assertJsonPath('data.variants.1.lyricist', 'Иван Проханов')
            ->assertJsonPath('data.variants.1.artist', 'Хор церкви')
            ->assertJsonPath('data.variants.0.composer', null)
            ->assertJsonPath('data.variants.0.hasChords', false)
            ->assertJsonPath('data.variants.0.sections', [
                ['type' => 'verse', 'label' => 'Куплет 1', 'lines' => [
                    [['chord' => null, 'text' => 'Свят Господь Вседержитель,']],
                    [['chord' => null, 'text' => 'Вся земля полна славы Твоей.']],
                ]],
                ['type' => 'chorus', 'label' => 'Припев', 'lines' => [
                    [['chord' => null, 'text' => 'Тебе поём хвалу на 100%.']],
                ]],
            ])
            ->assertJsonMissingPath('data.variants.0.chordpro')
            ->assertJsonMissingPath('data.variants.0.lyrics');

        $withChords = Song::query()->where('number', 214)->firstOrFail();

        $this->getJson("/api/v1/songs/{$withChords->id}")
            ->assertOk()
            ->assertJsonPath('data.variants.0.hasChords', true)
            ->assertJsonPath('data.variants.0.sections.0.lines.1', [
                ['chord' => null, 'text' => 'И ра'],
                ['chord' => 'G', 'text' => 'дость напол'],
                ['chord' => 'A7', 'text' => 'няет дом.'],
            ]);

        // Основной не отмечен — им считается первый по букве; текста нет — секций нет.
        $withoutText = Song::query()->where('number', 21)->firstOrFail();

        $this->getJson("/api/v1/songs/{$withoutText->id}")
            ->assertOk()
            ->assertJsonPath('data.variants.0.isDefault', true)
            ->assertJsonPath('data.variants.0.hasChords', false)
            ->assertJsonPath('data.variants.0.sections', []);
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
