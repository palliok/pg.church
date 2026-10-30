import './SongText.css';

const lineText = (parts) => parts.map((part) => part.text).join('');

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

// Текст песни по секциям (куплет, припев…). При chords аккорды встают над слогами,
// на которые приходятся; без них строки, где одни аккорды, пропускаются.
export default function SongText({ sections, chords = false, fontSize = 16, gap = 20 }) {
  return (
    <div className="song-text" style={{ fontSize, '--song-gap': `${gap}px` }}>
      {sections.map((section, i) => (
        <section key={i} className={section.type ? `song-section-${section.type}` : undefined}>
          {section.label && <p className="song-label">{section.label}</p>}
          {section.lines.length > 0 && (
            <div className="song-lines">
              {section.lines.map((parts, j) => {
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

                const text = lineText(parts).replace(/\s+/g, ' ').trim();

                return text && <div key={j} className="song-line">{text}</div>;
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
