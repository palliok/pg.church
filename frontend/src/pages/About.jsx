import { church } from '../data/mockData.js';

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
          <div
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              background: 'var(--c-panel)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 170,
                overflow: 'hidden',
              }}
            >
              <iframe
                src="https://yandex.ru/map-widget/v1/?um=constructor%3A406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39&source=constructor"
                title="Яндекс Карта"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block',
                }}
              />
            </div>

            <div style={{ padding: '22px 24px' }}>
              <div
                className="h-display"
                style={{ fontSize: 26 }}
              >
                {church.address}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 14,
                  font: '500 14px var(--f-body)',
                  color: 'var(--c-gray-text)',
                }}
              >
                <div className="card-row">
                  <span
                    className="icon-circle"
                    style={{
                      width: 19,
                      height: 19,
                      background: 'var(--c-purple)',
                      color: '#fff',
                      font: '700 10px var(--f-body)',
                    }}
                  >
                    М
                  </span>

                  {church.metro}
                </div>

                <a
                  href={church.phoneHref}
                  style={{
                    fontFamily: 'var(--f-head)',
                    fontWeight: 700,
                    fontSize: 19,
                    color: '#0d0d0d',
                    width: 'fit-content',
                  }}
                >
                  {church.phone}
                </a>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 7,
                  marginTop: 16,
                }}
              >
                {church.social.map((s) => (
                  <a
                    key={s.code}
                    href={s.href}
                    title={s.label}
                    className="icon-circle"
                    style={{
                      width: 38,
                      height: 38,
                      background: '#fff',
                      fontFamily: 'var(--f-head)',
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  >
                    {s.code}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}