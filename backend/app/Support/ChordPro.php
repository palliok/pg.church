<?php

namespace App\Support;

/**
 * Текст песни с аккордами в формате ChordPro (https://www.chordpro.org).
 *
 * Аккорды стоят в квадратных скобках прямо в строке, перед слогом, на который
 * приходятся: «[E]Свят, свят, свят Гос[A]подь». Секции задаются либо директивами
 * ChordPro ({start_of_chorus} … {end_of_chorus}, кратко {soc} … {eoc}), либо
 * проще — строкой-заголовком («Куплет 1», «Припев:») перед текстом; секции без
 * директив разделяются пустой строкой.
 *
 * Ноты записываются латиницей в принятой у нас немецкой системе: H — си,
 * B — си-бемоль.
 */
class ChordPro
{
    /** Слова, с которых начинается строка-заголовок секции => тип секции. */
    private const array HEADERS = [
        'куплет|запев|verse' => 'verse',
        'припев|chorus' => 'chorus',
        'предприпев|пред-припев|pre-?chorus' => 'prechorus',
        'бридж|мост|bridge' => 'bridge',
        'вступление|интро|intro' => 'intro',
        'проигрыш|interlude|instrumental' => 'interlude',
        'кода|концовка|окончание|outro|ending|coda' => 'outro',
        'тег|tag' => 'tag',
    ];

    /** Краткие формы директив: {sov}, {soc}, {sob}, {sot}, {sog}. */
    private const array ENVIRONMENTS = ['v' => 'verse', 'c' => 'chorus', 'b' => 'bridge', 't' => 'tab', 'g' => 'grid'];

    private const array COMMENTS = ['comment', 'c', 'comment_italic', 'ci', 'comment_box', 'cb', 'highlight'];

    /** Аккорд: Am, H7, C#m7, F#m7b5, Dsus4, Cmaj7, E/G#. */
    private const string CHORD = '[A-H][#b♯♭]?(?:maj|min|dim|aug|sus|add|m|M|\+|-|°|ø)?\d*(?:(?:maj|min|dim|aug|sus|add|M|\+|-|#|b)\d*)*(?:\([^)\s]*\))?(?:\/[A-H][#b♯♭]?)?';

    /** То, что встречается в строке аккордов помимо самих аккордов: такты, повторы, пауза. */
    private const string FILLER = '\|+|[-—%]|\(?[xх×]\s?\d+\)?|\(?\d+\s?[xх×]\)?|N\.?C\.?';

    /**
     * Разбирает текст на секции. Строка секции — список фрагментов: аккорд
     * (или null) и текст, который идёт после него до следующего аккорда.
     *
     * @return list<array{type: ?string, label: ?string, lines: list<list<array{chord: ?string, text: string}>>}>
     */
    public static function parse(?string $source): array
    {
        $sections = [];
        $current = null;      // секция, в которую сейчас добавляются строки
        $environment = false; // внутри {start_of_…}: пустая строка секцию не закрывает
        $pending = null;      // заголовок, ещё не получивший своих строк

        $close = function () use (&$sections, &$current, &$pending): void {
            if ($current !== null) {
                $sections[] = $current;
            } elseif ($pending !== null) {
                // Заголовок без текста — например, «Припев» как указание повторить припев.
                $sections[] = self::section($pending['type'], $pending['label']);
            }

            $current = $pending = null;
        };

        foreach (self::lines($source) as $line) {
            $line = trim($line);

            if (str_starts_with($line, '#')) {
                continue;
            }

            if (preg_match('/^\{\s*([\w-]+)\s*(?:[:\s]\s*(.*?))?\s*\}$/u', $line, $directive)) {
                $name = strtolower($directive[1]);
                $argument = $directive[2] ?? '';

                if (preg_match('/^(?:start_of_(\w+)|so([a-z]))$/', $name, $start)) {
                    $type = ($start[1] ?? '') !== '' ? $start[1] : (self::ENVIRONMENTS[$start[2]] ?? null);

                    if ($type !== null) {
                        $close();
                        $current = self::section($type, self::label($argument));
                        $environment = true;
                    }
                } elseif (preg_match('/^(?:end_of_\w+|eo[a-z])$/', $name)) {
                    $close();
                    $environment = false;
                } elseif ($name === 'chorus') {
                    $close();
                    $sections[] = self::section('chorus', self::label($argument));
                } elseif (in_array($name, self::COMMENTS, true) && $argument !== '') {
                    if ($current === null) {
                        // Комментарий перед текстом — заголовок секции: так секции размечает CCLI SongSelect.
                        $close();
                        $pending = self::header($argument) ?? ['type' => null, 'label' => $argument];
                    } else {
                        $current['lines'][] = [['chord' => null, 'text' => $argument]];
                    }
                }

                // Остальные директивы ({title}, {key}, {capo}, оформление) в текст не попадают.
                continue;
            }

            if ($line === '') {
                if (! $environment && $current !== null) {
                    $close();
                }

                continue;
            }

            if ($current === null) {
                if (($header = self::header($line)) !== null) {
                    $close();
                    $pending = $header;

                    continue;
                }

                $current = self::section($pending['type'] ?? null, $pending['label'] ?? null);
                $pending = null;
            }

            $current['lines'][] = in_array($current['type'], ['tab', 'grid'], true)
                ? [['chord' => null, 'text' => $line]]
                : self::parts($line);
        }

        $close();

        return $sections;
    }

    /**
     * Только слова, без аккордов, заголовков и директив: для поиска по строке.
     */
    public static function plainText(?string $source): string
    {
        $blocks = [];

        foreach (self::parse($source) as $section) {
            $lines = [];

            foreach ($section['lines'] as $parts) {
                $text = trim(preg_replace('/\s+/u', ' ', implode('', array_column($parts, 'text'))));

                if ($text !== '') {
                    $lines[] = $text;
                }
            }

            if ($lines !== []) {
                $blocks[] = implode("\n", $lines);
            }
        }

        return implode("\n\n", $blocks);
    }

    /**
     * Приводит запись «аккорды над строкой» (так песни выложены на большинстве
     * сайтов) к ChordPro: аккорды переносятся в строку текста под ними.
     * Текст, уже записанный в ChordPro, не меняется.
     */
    public static function normalize(?string $source): ?string
    {
        $lines = self::lines($source);
        $result = [];

        for ($i = 0; $i < count($lines); $i++) {
            $chords = self::chordLine($lines[$i]);

            if ($chords === null) {
                $result[] = rtrim($lines[$i]);

                continue;
            }

            $next = $lines[$i + 1] ?? '';

            if (self::isLyrics($next)) {
                $result[] = self::merge($chords, $next);
                $i++;
            } else {
                $result[] = implode(' ', array_map(fn (array $chord) => '['.$chord[0].']', $chords));
            }
        }

        $text = trim(implode("\n", $result));

        return $text === '' ? null : $text;
    }

    /**
     * @return list<string>
     */
    private static function lines(?string $source): array
    {
        if ($source === null || trim($source) === '') {
            return [];
        }

        return explode("\n", str_replace("\t", '    ', preg_replace('/\R/u', "\n", $source)));
    }

    /**
     * @return array{type: ?string, label: ?string, lines: list<mixed>}
     */
    private static function section(?string $type, ?string $label): array
    {
        return ['type' => $type, 'label' => $label, 'lines' => []];
    }

    /**
     * Метка секции из аргумента директивы: {soc: Припев 2} или {soc label="Припев 2"}.
     */
    private static function label(string $argument): ?string
    {
        if (preg_match('/label\s*=\s*"([^"]*)"/u', $argument, $match)) {
            $argument = $match[1];
        }

        $argument = trim($argument);

        return $argument === '' ? null : $argument;
    }

    /**
     * Распознаёт строку-заголовок: «Куплет 1», «Припев:», «Chorus x2», «[Verse 1]».
     *
     * @return array{type: string, label: string}|null
     */
    private static function header(string $line): ?array
    {
        $text = trim($line);

        if (preg_match('/^\[([^\[\]]+)\]$/u', $text, $match)) {
            $text = trim($match[1]);
        }

        $text = rtrim($text, ':. ');

        foreach (self::HEADERS as $words => $type) {
            if (preg_match('/^(?:'.$words.')(?:\s*\d+)?(?:\s*\(?[xх×]\s?\d+\)?)?$/iu', $text)) {
                return ['type' => $type, 'label' => $text];
            }
        }

        return null;
    }

    /**
     * «[E]Свят, свят [A]свят» → [E + «Свят, свят »], [A + «свят»].
     *
     * @return list<array{chord: ?string, text: string}>
     */
    private static function parts(string $line): array
    {
        $chunks = preg_split('/\[([^\[\]]*)\]/u', $line, -1, PREG_SPLIT_DELIM_CAPTURE);
        $parts = $chunks[0] === '' ? [] : [['chord' => null, 'text' => $chunks[0]]];

        for ($i = 1; $i < count($chunks); $i += 2) {
            $chord = trim(ltrim(trim($chunks[$i]), '*'));

            $parts[] = ['chord' => $chord === '' ? null : $chord, 'text' => $chunks[$i + 1] ?? ''];
        }

        return $parts;
    }

    /**
     * Если строка состоит только из аккордов — возвращает их с позициями
     * (номер символа в строке), иначе null.
     *
     * @return list<array{string, int}>|null
     */
    private static function chordLine(string $line): ?array
    {
        if (str_contains($line, '[') || ! preg_match_all('/\S+/u', $line, $tokens, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        $chords = [];

        foreach ($tokens[0] as [$token, $offset]) {
            if (preg_match('/^(?:'.self::CHORD.')$/u', $token)) {
                $chords[] = [$token, mb_strlen(substr($line, 0, $offset))];
            } elseif (! preg_match('/^(?:'.self::FILLER.')$/u', $token)) {
                return null;
            }
        }

        return $chords === [] ? null : $chords;
    }

    /**
     * Строка, над которой могут стоять аккорды: обычный текст, а не директива,
     * заголовок секции или ещё одна строка аккордов.
     */
    private static function isLyrics(string $line): bool
    {
        $line = trim($line);

        return $line !== ''
            && ! str_starts_with($line, '{')
            && ! str_starts_with($line, '#')
            && ! str_contains($line, '[')
            && self::header($line) === null
            && self::chordLine($line) === null;
    }

    /**
     * Вставляет аккорды в строку текста на те же позиции, где они стояли над ней.
     *
     * @param  list<array{string, int}>  $chords
     */
    private static function merge(array $chords, string $lyrics): string
    {
        $characters = mb_str_split(rtrim($lyrics));

        foreach (array_reverse($chords) as [$chord, $position]) {
            $characters = array_pad($characters, $position, ' ');

            array_splice($characters, $position, 0, ['['.$chord.']']);
        }

        return implode('', $characters);
    }
}
