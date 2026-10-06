import ContactsCard from '../components/ContactsCard.jsx';

export default function About() {
  return (
    <div
      className="page-enter container"
      style={{ padding: '26px 16px 48px' }}
    >
      <div className="eyebrow">Церковь «Поклонная гора»</div>

      <h1
        className="h-display"
        style={{ fontSize: 'clamp(34px, 6vw, 54px)', marginTop: 8 }}
      >
        О церкви
      </h1>

      <div className="split-layout" style={{ marginTop: 26 }}>
        <div>
          <div
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              minHeight: 320,
              position: 'relative',
              backgroundColor: '#0d0d0d',
              backgroundImage:
                'linear-gradient(to top, rgba(5,5,5,.92) 10%, rgba(5,5,5,.2) 70%), repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 11px, transparent 11px 22px)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 32,
            }}
          >
            <div
              className="h-display"
              style={{ fontSize: 'clamp(30px, 5vw, 46px)' }}
            >
              Живая церковь
              <br />
              в сердце города
            </div>

            <p
              style={{
                font: '500 15px/1.6 var(--f-body)',
                color: 'rgba(255,255,255,.72)',
                maxWidth: 480,
                margin: '14px 0 0',
              }}
            >
              Мы протестантская церковь, которая верит в Библию, во Христа и в
              общину — там, где вера становится жизнью, а не просто словами по
              воскресеньям.
            </p>
          </div>

          <p
            style={{
              font: '500 16px/1.65 var(--f-body)',
              color: '#3a3a3a',
              marginTop: 22,
              maxWidth: 680,
            }}
          >
            Мы начинались как небольшая группа друзей, а сегодня — это сотни
            людей, которые вместе растут в вере, служат ближним и открывают
            двери каждому, кто ищет. Здесь не спрашивают, «достоин ли ты»,
            здесь просто рады, что ты пришёл.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              borderRadius: 24,
              background: 'var(--c-purple)',
              color: '#fff',
              padding: 26,
            }}
          >
            <div
              className="eyebrow"
              style={{ color: 'rgba(255,255,255,.6)' }}
            >
              Во что мы верим
            </div>

            <div
              className="h-display"
              style={{ fontSize: 30, marginTop: 12 }}
            >
              Библия,
              <br />
              Христос,
              <br />
              община
            </div>

            <p
              style={{
                font: '500 14px/1.6 var(--f-body)',
                color: 'rgba(255,255,255,.78)',
                margin: '14px 0 0',
              }}
            >
              Мы живём по Писанию, верим в спасение по благодати и растём
              вместе в малых группах.
            </p>
          </div>

          {/* Яндекс Карта */}
          <ContactsCard />
        </div>
      </div>
    </div>
  );
}
