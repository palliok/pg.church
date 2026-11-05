import './SongText.css';

const lineText = (parts) => parts.map((part) => part.text).join('');

// Строка без слов: одни аккорды, такты, доли и повторы («[Am] [F] | [C] [G] x2», «| [D] / / |»).
// То же, что FILLER в App\Support\ChordPro.
const NO_LYRICS = /^(?:\s|\|+|\/+|[-—%]|\(?[xх×]\s?\d+\)?|\(?\d+\s?[xх×]\)?|N\.?C\.?)*$/u;
const hasLyrics = (parts) => !NO_LYRICS.test(lineText(parts));

// Блок для одних музыкантов: табулатура, сетка аккордов, строки без слов
// или заголовок вступления и проигрыша без текста (повтор). Без аккордов он не нужен.
function isInstrumental(section) {
  if (['tab', 'grid'].includes(section.type)) return true;
  if (section.lines.length === 0) return ['intro', 'interlude'].includes(section.type);

  return !section.lines.some(hasLyrics);
}

// Делит строку на слова, чтобы она переносилась только по пробелам, а не посреди
// слова, над которым стоит аккорд. Слово — список кусочков { chord, text }.
function toWords(parts) {
  const words = [];
  const pieces = [];
  let unfinished = false; // последнее слово ещё не закончилось пробелом

  for (const part of parts) {
    (part.text.match(/\s+|\S+\s*/g) ?? ['']).forEach((text, i) => {
      const piece = { chord: i === 0 ? part.chord : null, text };

      if (unfinished) words[words.length - 1].push(piece);
      else words.push([piece]);

      pieces.push(piece);
      unfinished = !/\s$/.test(text);
    });
  }

  // Аккорд шире своего кусочка текста раздвигал бы слова. Если до следующего
  // аккорда хватает места, он нависает над соседним текстом и ширины не занимает.
  pieces.forEach((piece, i) => {
    if (!piece.chord) return;

    let room = piece.text.length;
    let next = i + 1;
    while (next < pieces.length && !pieces[next].chord) room += pieces[next++].text.length;

    piece.overhang = next === pieces.length || piece.chord.length < room;
  });

  return words;
}

// «Припев x2» → ['Припев', 2]: число повторов показывается отдельной плашкой,
// а по метке без него ищется, что повторить.
function splitRepeat(label) {
  const match = (label ?? '').match(/^(.*?)\s*\(?[xх×]\s?(\d+)\)?$/iu);
  return match ? [match[1], Number(match[2])] : [label ?? '', null];
}

const baseLabel = (label) => splitRepeat(label)[0].toLowerCase();

function SectionLabel({ label }) {
  const [text, times] = splitRepeat(label);

  return (
    <p className="song-label">
      {text}
      {times && <span className="song-repeat">×{times}</span>}
    </p>
  );
}

// Заголовок без текста — повтор («Припев», «Припев x2», «Куплет 1»): под ним текст
// последней секции выше с той же меткой, а для припева, бриджа и т. п. — того же типа.
// Подпись остаётся своя, с числом повторов.
function withRepeats(sections) {
  return sections.map((section, i) => {
    if (section.lines.length > 0) return section;

    const before = sections.slice(0, i).reverse().filter((item) => item.lines.length > 0);
    const source = before.find((item) => section.label && baseLabel(item.label) === baseLabel(section.label))
      ?? (section.type && section.type !== 'verse' ? before.find((item) => item.type === section.type) : null);

    return source ? { ...section, lines: source.lines } : section;
  });
}

// Текст песни по секциям (куплет, припев…). При chords аккорды встают над слогами,
// на которые приходятся; без них строки и блоки, где одни аккорды, пропускаются.
export default function SongText({ sections, chords = false, fontSize = 16, gap = 20 }) {
  return (
    <div className="song-text" style={{ fontSize, '--song-gap': `${gap}px` }}>
      {withRepeats(sections).map((section, i) => (!chords && isInstrumental(section) ? null : (
        <section key={i} className={section.type ? `song-section-${section.type}` : undefined}>
          {section.label && <SectionLabel label={section.label} />}
          {section.lines.length > 0 && (
            <div className="song-lines">
              {section.lines.map((parts, j) => {
                // Строка без слов — аккорды, такты и повторы в один ряд: «A E | H7 E x2».
                if (chords && !hasLyrics(parts)) {
                  return (
                    <div key={j} className="song-line song-line-bare">
                      {parts.flatMap((part, k) => [
                        part.chord && <span key={`c${k}`} className="song-chord">{part.chord}</span>,
                        part.text.trim() && <span key={`t${k}`} className="song-bar">{part.text.trim()}</span>,
                      ])}
                    </div>
                  );
                }

                if (chords && parts.some((part) => part.chord)) {
                  return (
                    <div key={j} className="song-line song-line-chords">
                      {toWords(parts).map((word, k) => (
                        <span key={k} className="song-word">
                          {word.map((piece, m) => (
                            <span key={m} className="song-piece">
                              {piece.chord && <span className={piece.overhang ? 'song-chord song-chord-over' : 'song-chord'}>{piece.chord}</span>}
                              <span>{piece.text}</span>
                            </span>
                          ))}
                        </span>
                      ))}
                    </div>
                  );
                }

                if (!hasLyrics(parts)) return null;

                return <div key={j} className="song-line">{lineText(parts).replace(/\s+/g, ' ').trim()}</div>;
              })}
            </div>
          )}
        </section>
      )))}
    </div>
  );
}
