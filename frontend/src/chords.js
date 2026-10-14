// Транспонирование аккордов. Ноты — в немецкой системе, как в сборнике:
// H — си, B — си-бемоль (см. backend/README.md, «Формат песен»).

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'B', 'H'];
const NATURALS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 10, H: 11 };

// Тональности, которые записывают с бемолями: F, B, Es, As, Des и их параллельные миноры.
const FLAT_MAJORS = [5, 10, 3, 8, 1];
const FLAT_MINORS = [2, 7, 0, 5, 10, 3];

const CHORD = /^([A-H])([#b♯♭]?)(.*?)(?:\/([A-H])([#b♯♭]?))?$/;

function pitch(letter, accidental) {
  // «Bb» пишут, имея в виду тот же си-бемоль, что и «B», а не ля.
  if (letter === 'B' && /[b♭]/.test(accidental)) return 10;

  return (NATURALS[letter] + ({ '#': 1, '♯': 1, b: -1, '♭': -1 }[accidental] ?? 0) + 12) % 12;
}

const shift = (value, steps) => (((value + steps) % 12) + 12) % 12;

// Высота основного тона аккорда и минор ли он; null — не аккорд.
function parse(chord) {
  const match = CHORD.exec(chord ?? '');
  if (!match) return null;

  return { root: pitch(match[1], match[2]), minor: /^m(?!aj)/.test(match[3]) };
}

// Тональность песни: из карточки песни, иначе по первому аккорду.
export function songKey(song) {
  if (parse(song.key)) return song.key;

  for (const section of song.sections) {
    for (const parts of section.lines) {
      const chord = parts.find((part) => parse(part.chord))?.chord;
      if (chord) return chord;
    }
  }

  return null;
}

// Сдвигает аккорд на steps полутонов. Диезы или бемоли — по новой тональности:
// в F будет B и Gm, а не A# и Gm, в E — C#m, а не Dbm.
export function transposeChord(chord, steps, key) {
  if (!steps) return chord;

  const match = CHORD.exec(chord ?? '');
  if (!match) return chord;

  const tonic = parse(key) ?? parse(chord);
  const target = shift(tonic.root, steps);
  const names = (tonic.minor ? FLAT_MINORS : FLAT_MAJORS).includes(target) ? FLATS : SHARPS;
  const name = (letter, accidental) => names[shift(pitch(letter, accidental), steps)];

  return name(match[1], match[2]) + match[3] + (match[4] ? `/${name(match[4], match[5])}` : '');
}

export function transposeSections(sections, steps, key) {
  if (!steps) return sections;

  return sections.map((section) => ({
    ...section,
    lines: section.lines.map((parts) => parts.map((part) => (part.chord ? { ...part, chord: transposeChord(part.chord, steps, key) } : part))),
  }));
}
