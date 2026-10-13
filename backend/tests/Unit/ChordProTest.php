<?php

namespace Tests\Unit;

use App\Support\ChordPro;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ChordProTest extends TestCase
{
    public function test_parses_inline_chords_into_parts(): void
    {
        $sections = ChordPro::parse('[E]Свят, свят, свят Гос[A]подь Вседержи[E]тель');

        $this->assertSame([[
            'type' => null,
            'label' => null,
            'lines' => [[
                ['chord' => 'E', 'text' => 'Свят, свят, свят Гос'],
                ['chord' => 'A', 'text' => 'подь Вседержи'],
                ['chord' => 'E', 'text' => 'тель'],
            ]],
        ]], $sections);
    }

    public function test_text_before_first_chord_and_chords_without_text(): void
    {
        $lines = ChordPro::parse("Вся зем[C#m]ля\n[Am] [F] [G7]")[0]['lines'];

        $this->assertSame([
            ['chord' => null, 'text' => 'Вся зем'],
            ['chord' => 'C#m', 'text' => 'ля'],
        ], $lines[0]);
        $this->assertSame(['Am', 'F', 'G7'], array_column($lines[1], 'chord'));
    }

    public function test_header_lines_start_sections_separated_by_blank_lines(): void
    {
        $sections = ChordPro::parse(<<<'TEXT'
            Куплет 1
            Первая строка
            Вторая строка

            Припев:
            Строка припева

            Строфа без заголовка

            Бридж x2
            Строка бриджа
            TEXT);

        $this->assertSame(
            [['verse', 'Куплет 1', 2], ['chorus', 'Припев', 1], [null, null, 1], ['bridge', 'Бридж x2', 1]],
            array_map(fn (array $s) => [$s['type'], $s['label'], count($s['lines'])], $sections),
        );
    }

    public function test_header_may_stand_in_its_own_block(): void
    {
        $sections = ChordPro::parse("Куплет 1\n\nТекст куплета\n\nПрипев\n\nТекст припева");

        $this->assertSame(
            [['verse', 'Куплет 1', 1], ['chorus', 'Припев', 1]],
            array_map(fn (array $s) => [$s['type'], $s['label'], count($s['lines'])], $sections),
        );
    }

    public function test_header_without_text_is_a_repeat_marker(): void
    {
        $sections = ChordPro::parse("Припев\nТекст припева\n\nКуплет 2\nТекст\n\nПрипев\n\nКуплет 3\nТекст\n\nПрипев");

        $this->assertSame(
            [['chorus', 1], ['verse', 1], ['chorus', 0], ['verse', 1], ['chorus', 0]],
            array_map(fn (array $s) => [$s['type'], count($s['lines'])], $sections),
        );
    }

    public function test_a_header_word_inside_a_verse_is_just_text(): void
    {
        $sections = ChordPro::parse("Куплет 1\nПою я\nПрипев\nмоей души");

        $this->assertCount(1, $sections);
        $this->assertCount(3, $sections[0]['lines']);
    }

    public function test_parses_chordpro_environment_directives(): void
    {
        $sections = ChordPro::parse(<<<'TEXT'
            {title: Свят, свят, свят}
            {key: E}
            {capo: 2}
            # строка-примечание
            {start_of_verse: Куплет 1}
            [E]Первая строка

            вторая строка после пустой
            {end_of_verse}
            {soc}
            Строка припева
            {eoc}
            {start_of_bridge label="Бридж 2"}
            Строка бриджа
            {end_of_bridge}
            {chorus}
            {chorus: Финал}
            TEXT);

        $this->assertSame(
            [['verse', 'Куплет 1', 2], ['chorus', null, 1], ['bridge', 'Бридж 2', 1], ['chorus', null, 0], ['chorus', 'Финал', 0]],
            array_map(fn (array $s) => [$s['type'], $s['label'], count($s['lines'])], $sections),
        );
    }

    public function test_comment_before_text_labels_the_section(): void
    {
        // Так секции размечает экспорт CCLI SongSelect.
        $sections = ChordPro::parse("{comment: Verse 1}\n[G]Amazing grace\n\n{c: Chorus}\nHow sweet\n{c: 2 раза}");

        $this->assertSame(['verse', 'Verse 1'], [$sections[0]['type'], $sections[0]['label']]);
        $this->assertSame(['chorus', 'Chorus'], [$sections[1]['type'], $sections[1]['label']]);
        $this->assertSame([['chord' => null, 'text' => '2 раза']], $sections[1]['lines'][1]);
    }

    public function test_bracketed_header_is_not_a_chord(): void
    {
        $sections = ChordPro::parse("[Verse 1]\n[Am]Line\n\n[Припев]\nСтрока");

        $this->assertSame(['verse', 'chorus'], array_column($sections, 'type'));
        $this->assertSame('Verse 1', $sections[0]['label']);
    }

    public function test_plain_text_drops_chords_headers_and_directives(): void
    {
        $text = ChordPro::plainText(<<<'TEXT'
            {key: E}
            Куплет 1
            [E]Свят, свят, свят Гос[A]подь Вседержи[E]тель,
            Вся зем[C#m]ля  пол[A]на славы Тво[H7]ей.
            [E] [A] [H7]

            Припев
            Те[A]бе поём хва[E]лу
            TEXT);

        $this->assertSame(
            "Свят, свят, свят Господь Вседержитель,\nВся земля полна славы Твоей.\n\nТебе поём хвалу",
            $text,
        );
    }

    public function test_empty_source(): void
    {
        $this->assertSame([], ChordPro::parse(null));
        $this->assertSame([], ChordPro::parse("  \n\n "));
        $this->assertSame('', ChordPro::plainText(null));
        $this->assertNull(ChordPro::normalize("  \n "));
    }

    public function test_normalize_moves_chords_above_lyrics_into_the_line(): void
    {
        $source = <<<'TEXT'
            Куплет 1
            E                   A            E
            Свят, свят, свят Господь Вседержитель,
                   C#m   A           H7
            Вся земля полна славы Твоей.

            Проигрыш
            Am  F  |  C  G  x2
            TEXT;

        $this->assertSame(<<<'TEXT'
            Куплет 1
            [E]Свят, свят, свят Гос[A]подь Вседержи[E]тель,
            Вся зем[C#m]ля пол[A]на славы Тво[H7]ей.

            Проигрыш
            [Am] [F] [C] [G]
            TEXT, ChordPro::normalize($source));
    }

    public function test_normalize_pads_short_lyric_lines(): void
    {
        $this->assertSame('Аминь  [E]    [A]', ChordPro::normalize("       E   A\nАминь"));
    }

    public function test_normalize_keeps_chordpro_and_plain_lyrics_untouched(): void
    {
        $chordpro = "{soc}\n[E]Свят, свят, [A]свят\n{eoc}\n\nКуплет 2\nПросто текст без аккордов";

        $this->assertSame($chordpro, ChordPro::normalize($chordpro));
        $this->assertSame($chordpro, ChordPro::normalize(str_replace("\n", "\r\n", $chordpro)."\r\n"));
    }

    public function test_normalize_is_idempotent(): void
    {
        $once = ChordPro::normalize("Am      E\nСвят, свят\n\nH7\nСвят");

        $this->assertSame("[Am]Свят, св[E]ят\n\n[H7]Свят", $once);
        $this->assertSame($once, ChordPro::normalize($once));
    }

    /**
     * @return array<string, array{string, bool}>
     */
    public static function chordLines(): array
    {
        return [
            'простые аккорды' => ['Am  Dm  E7', true],
            'си и си-бемоль' => ['H7   Hm   B   Bb', true],
            'сложные аккорды' => ['C#m7  F#m7b5  Dsus4  Cmaj7  E/G#  A7sus4  Gadd9', true],
            'такты и повторы' => ['| Am | F | x2', true],
            'русский текст' => ['Свят, свят, свят', false],
            'кириллические буквы, похожие на ноты' => ['А  С  Е', false],
            'английский текст' => ['Amazing grace', false],
            'слово, начинающееся с ноты' => ['Am Dm Every', false],
        ];
    }

    #[DataProvider('chordLines')]
    public function test_recognizes_chord_lines(string $line, bool $isChordLine): void
    {
        $normalized = ChordPro::normalize($line."\nтекст под строкой");

        $this->assertSame($isChordLine, str_contains($normalized, '['));
    }
}
