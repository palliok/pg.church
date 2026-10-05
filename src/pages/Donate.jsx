import { useState } from 'react';
import { t } from '../i18n.js';
import ArrowKnob from '../components/ArrowKnob.jsx';
import { donationAmounts, donationTargets } from '../data/mockData.js';

export default function Donate() {
  const [amount, setAmount] = useState(donationAmounts[1]);

  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div className="donate-layout">
        <div style={{ borderRadius: 24, background: 'var(--c-yellow)', color: '#0d0d0d', padding: 'clamp(24px, 4vw, 40px)' }}>
          <div style={{ display: 'inline-flex', background: '#0d0d0d', color: '#fff', padding: '8px 13px', borderRadius: 9, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Пожертвование
          </div>
          <h1 className="h-display" style={{ fontSize: 'clamp(38px, 7vw, 64px)', marginTop: 22 }}>Поддержать<br />служение</h1>
          <p style={{ font: '500 16px/1.6 var(--f-body)', color: 'rgba(13,13,13,.7)', margin: '18px 0 0', maxWidth: 460 }}>
            Вместе мы несём служение церкви и заботу о ближних. Любой дар важен — от него зависит и аренда
            зала, и помощь тем, кому сейчас тяжело.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            {donationAmounts.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className="pill-btn"
                style={{ padding: '14px 22px', fontSize: 14, background: amount === a ? '#0d0d0d' : 'rgba(13,13,13,.08)', color: amount === a ? '#fff' : '#0d0d0d' }}
              >
                {a.toLocaleString('ru-RU')} ₽
              </button>
            ))}
          </div>

          <a href="#pay" className="pill-btn" style={{ marginTop: 16, padding: '8px 8px 8px 26px', background: '#0d0d0d', color: '#fff' }}>
            <span style={{ fontSize: 15 }}>{t('Пожертвовать')} {amount.toLocaleString('ru-RU')} ₽</span>
            <ArrowKnob size={44} bg="var(--c-yellow)" fg="#0d0d0d" />
          </a>
        </div>

        <div style={{ borderRadius: 24, background: '#0d0d0d', color: '#fff', padding: 'clamp(24px, 4vw, 34px)' }}>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>Куда идут пожертвования</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
            {donationTargets.map((t) => (
              <div key={t.title} className="card-row" style={{ padding: '18px 0', borderTop: '1px solid rgba(255,255,255,.14)' }}>
                <span style={{ flex: '0 0 44px', height: 44, borderRadius: 12, background: t.color }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', font: '600 16px var(--f-body)' }}>{t.title}</span>
                  <span style={{ display: 'block', font: '500 12.5px var(--f-body)', color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{t.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, padding: '18px 20px', borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', font: '500 13px/1.6 var(--f-body)', color: 'rgba(255,255,255,.7)' }}>
            Раз в квартал мы публикуем отчёт: сколько собрали и на что израсходовали.
          </div>
        </div>
      </div>
    </div>
  );
}
