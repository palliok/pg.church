<?php

namespace App\Console\Commands;

use App\Models\Song;
use App\Models\SongVariant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('songs:import
    {path? : Папка с файлами .cho; по умолчанию — сборник database/data/songbook}
    {--update : Перезаписать уже существующие песни и варианты (иначе они пропускаются)}')]
#[Description('Загрузить песни из файлов ChordPro (.cho): номер и буква варианта — из {meta: number} и {meta: variant}')]
class ImportSongs extends Command
{
    /** Директивы шапки: они становятся полями песни и варианта, в текст не попадают. */
    private const array HEADER = ['title', 't', 'subtitle', 'st', 'meta', 'key', 'capo', 'artist', 'composer', 'lyricist'];

    public function handle(): int
    {
        $path = $this->argument('path') ?? database_path('data/songbook');
        $files = glob(rtrim($path, '/').'/*.cho') ?: [];

        if ($files === []) {
            $this->error("В папке {$path} нет файлов .cho");

            return self::FAILURE;
        }

        sort($files);
        $update = (bool) $this->option('update');
        $counts = ['created' => 0, 'updated' => 0, 'skipped' => 0];
        $failed = false;

        foreach ($files as $file) {
            foreach (self::parse(file_get_contents($file)) as $variant) {
                if ($variant['number'] === null || $variant['letter'] === null || $variant['title'] === null) {
                    $failed = true;
                    $this->error(basename($file).': нет {title}, {meta: number} или {meta: variant}');

                    continue;
                }

                $counts[$this->save($variant, $update)]++;
            }
        }

        $this->info("Добавлено вариантов: {$counts['created']}, обновлено: {$counts['updated']}, пропущено: {$counts['skipped']}");

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @param  array{number: int, letter: string, title: string, label: ?string, key: ?string, capo: ?int, artist: ?string, composer: ?string, lyricist: ?string, chordpro: string}  $data
     * @return 'created'|'updated'|'skipped'
     */
    private function save(array $data, bool $update): string
    {
        return DB::transaction(function () use ($data, $update) {
            $song = Song::query()->firstOrCreate(['number' => $data['number']], ['title' => $data['title']]);
            $variant = SongVariant::query()->where('song_id', $song->id)->where('letter', $data['letter'])->first();

            if ($variant && ! $update) {
                return 'skipped';
            }

            // Название песни — по основному варианту «а».
            if ($update && $data['letter'] === 'а' && $song->title !== $data['title']) {
                $song->update(['title' => $data['title']]);
            }

            $fields = collect($data)->only(['label', 'key', 'capo', 'artist', 'composer', 'lyricist', 'chordpro'])->all();
            $isNew = $variant === null;

            $variant ??= new SongVariant(['song_id' => $song->id, 'letter' => $data['letter']]);
            $variant->fill($fields);

            if ($data['letter'] === 'а') {
                $variant->is_default = true;
            }

            $variant->save();

            return $isNew ? 'created' : 'updated';
        });
    }

    /**
     * Делит файл на варианты по {new_song} и вынимает из каждого шапку.
     * Строки «# …» — заметки составителя сборника, в текст они не попадают.
     *
     * @return list<array{number: ?int, letter: ?string, title: ?string, label: ?string, key: ?string, capo: ?int, artist: ?string, composer: ?string, lyricist: ?string, chordpro: string}>
     */
    public static function parse(string $source): array
    {
        $variants = [];

        foreach (preg_split('/^\{\s*(?:new_song|ns)\s*\}\s*$/mu', $source) as $block) {
            $data = ['number' => null, 'letter' => null, 'title' => null, 'label' => null, 'key' => null, 'capo' => null,
                'artist' => null, 'composer' => null, 'lyricist' => null];
            $body = [];

            foreach (preg_split('/\R/u', $block) as $line) {
                if (str_starts_with(ltrim($line), '#')) {
                    continue;
                }

                if (! preg_match('/^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/u', trim($line), $match) || ! in_array($match[1], self::HEADER, true)) {
                    $body[] = $line;

                    continue;
                }

                $value = trim($match[2] ?? '');

                match ($match[1]) {
                    'title', 't' => $data['title'] = $value,
                    'subtitle', 'st' => $data['label'] = $value,
                    'key' => $data['key'] = $value,
                    'capo' => $data['capo'] = (int) $value ?: null,
                    'meta' => self::meta($data, $value),
                    default => $data[$match[1]] = $value,
                };
            }

            $chordpro = trim(implode("\n", $body));

            if ($chordpro !== '' || $data['title'] !== null) {
                $variants[] = $data + ['chordpro' => $chordpro];
            }
        }

        return $variants;
    }

    /**
     * {meta: number 13}, {meta: variant б}, {meta: artist …} — имя и значение через пробел.
     *
     * @param  array<string, mixed>  $data
     */
    private static function meta(array &$data, string $value): void
    {
        [$name, $content] = array_pad(preg_split('/\s+/u', $value, 2), 2, '');

        match ($name) {
            'number' => $data['number'] = ctype_digit($content) ? (int) $content : null,
            'variant' => $data['letter'] = mb_strtolower(trim($content)) ?: null,
            'artist', 'composer', 'lyricist' => $data[$name] = trim($content) ?: null,
            default => null,
        };
    }
}
