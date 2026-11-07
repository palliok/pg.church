<?php

namespace Tests\Feature\Console;

use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ImportSongsTest extends TestCase
{
    use RefreshDatabase;

    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dir = sys_get_temp_dir().'/songbook-'.uniqid();
        File::ensureDirectoryExists($this->dir);
        File::put($this->dir.'/013 Ты — помощь мне.cho', <<<'CHO'
            {title: Ты — помощь мне, Господь}
            {subtitle: Общее пение}
            {meta: number 13}
            {meta: variant а}
            # Источник: Общее пение v6.txt

            {start_of_verse: label="Куплет 1"}
            Ты — помощь мне, Господь, на всякий час
            {end_of_verse}

            {new_song}

            {title: Ты — помощь мне, Господь}
            {subtitle: Workship}
            {meta: number 13}
            {meta: variant б}
            {key: E}
            {capo: 2}

            {start_of_verse: label="Куплет 1"}
            Ты — пом[E]ощь мне, Госп[E]одь
            {end_of_verse}
            CHO);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);

        parent::tearDown();
    }

    public function test_imports_song_with_variants_without_header_in_text(): void
    {
        $this->artisan('songs:import', ['path' => $this->dir])->assertSuccessful();

        $song = Song::query()->where('number', 13)->sole();
        $this->assertSame('Ты — помощь мне, Господь', $song->title);

        [$first, $second] = $song->variants()->orderBy('letter')->get()->all();
        $this->assertTrue($first->is_default);
        $this->assertSame('Общее пение', $first->label);
        $this->assertStringStartsWith('{start_of_verse: label="Куплет 1"}', $first->chordpro);
        $this->assertStringNotContainsString('Источник', $first->chordpro);

        $this->assertFalse($second->is_default);
        $this->assertSame(['Workship', 'E', 2], [$second->label, $second->key, $second->capo]);
        $this->assertSame('Ты — помощь мне, Господь', $second->lyrics);
    }

    public function test_keeps_edited_variants_unless_update_is_given(): void
    {
        $this->artisan('songs:import', ['path' => $this->dir])->assertSuccessful();
        $variant = Song::query()->where('number', 13)->sole()->variants()->where('letter', 'а')->sole();
        $variant->update(['label' => 'Поправлено в админке']);

        $this->artisan('songs:import', ['path' => $this->dir])->assertSuccessful();
        $this->assertSame('Поправлено в админке', $variant->fresh()->label);
        $this->assertSame(2, $variant->song->variants()->count());

        $this->artisan('songs:import', ['path' => $this->dir, '--update' => true])->assertSuccessful();
        $this->assertSame('Общее пение', $variant->fresh()->label);
    }

    public function test_fails_on_empty_folder(): void
    {
        $this->artisan('songs:import', ['path' => $this->dir.'/missing'])->assertFailed();
    }
}
