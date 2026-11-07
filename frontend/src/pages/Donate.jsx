import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';
import LoadStatus from '../components/LoadStatus.jsx';
import { CheckIcon, CopyIcon } from '../components/Icons.jsx';
import { useDonation } from '../api/donation.js';
import './Donate.css';

// Текстовые реквизиты — Arimo, остальные — номера моноширинным.
const TEXT_FIELDS = new Set(['recipient', 'bank', 'purpose']);

// Порядок полей на телефоне, одной колонкой: сначала то, что вводят в банке первым.
// На десктопе слева текстовые поля, справа номера (см. Donate.css).
const MOBILE_ORDER = { recipient: 1, account: 2, bic: 3, innKpp: 4, bank: 5, correspondentAccount: 6, purpose: 7 };

// Счёт в 20 цифр показываем группами, как в банковских документах: 40703 810 5 5500 0000365.
// Копируется всё равно сплошная строка.
function groupDigits(key, value) {
  const digits = String(value);
  if ((key === 'account' || key === 'correspondentAccount') && /^\d{20}$/.test(digits)) {
    return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 9)} ${digits.slice(9, 13)} ${digits.slice(13)}`;
  }
  return digits;
}

// Копирование по нажатию: copy(key, value), stateOf(key) — 'success' | 'error' | ''. Успех гаснет сам.
function useCopy() {
  const [status, setStatus] = useState({ key: '', state: '' });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(key, value) {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus({ key, state: 'success' });
      timer.current = setTimeout(() => setStatus({ key: '', state: '' }), 1800);
    } catch {
      setStatus({ key, state: 'error' });
    }
  }

  return { copy, stateOf: (key) => (status.key === key ? status.state : '') };
}

// Поле реквизита: подпись над значением, нажатие копирует значение. После копирования подпись
// сообщает результат (role="status" — для экранного диктора), значок меняется на галочку.
function Field({ field, copier, id }) {
  const state = copier.stateOf(id);
  const note = state === 'success' ? t('Скопировано') : state === 'error' ? t('Не удалось скопировать') : field.label;
  return (
    <button type="button" className={`donate-field${TEXT_FIELDS.has(field.key) ? '' : ' is-number'}`} data-state={state} aria-label={`${t('Копировать')} ${field.label}: ${field.value}`} onClick={() => copier.copy(id, field.value)}>
      <span className="donate-field-label" role="status">{note}</span>
      <span className="donate-field-value">{TEXT_FIELDS.has(field.key) ? field.value : groupDigits(field.key, field.value)}</span>
      <span className="donate-field-icon" aria-hidden="true">{state === 'success' ? <CheckIcon /> : <CopyIcon />}</span>
    </button>
  );
}

// Реквизиты счёта: светлая панель, все поля одного вида. Десктоп — две колонки (текст слева, номера справа),
// телефон — одна, в порядке MOBILE_ORDER.
function AccountDetails({ account, copier }) {
  const fields = Object.fromEntries(account.fields.map((field) => [field.key, field]));
  if (account.paymentPurpose) fields.purpose = { key: 'purpose', label: t('Назначение платежа'), value: account.paymentPurpose };
  const field = (key) => fields[key] && (
    <div className="donate-field-slot" style={{ '--order': MOBILE_ORDER[key] }}>
      <Field field={fields[key]} copier={copier} id={`${account.id}:${key}`} />
    </div>
  );

  return (
    <section className="donate-details" aria-label={account.title ?? t('Реквизиты для пожертвований')}>
      <div className="donate-details-col">
        {field('recipient')}
        {field('bank')}
        {field('purpose')}
      </div>
      <div className="donate-details-col">
        {field('account')}
        {field('correspondentAccount')}
        {field('bic')}
        {(fields.inn || fields.kpp) && (
          <div className="donate-field-pair" style={{ '--order': MOBILE_ORDER.innKpp }}>
            {fields.inn && <Field field={fields.inn} copier={copier} id={`${account.id}:inn`} />}
            {fields.kpp && <Field field={fields.kpp} copier={copier} id={`${account.id}:kpp`} />}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Donate() {
  const { donation, loading, error, retry } = useDonation();
  const copier = useCopy();
  const accounts = donation?.accounts ?? [];

  return (
    <div className="page-enter container page-bg" style={{ '--title-chars': t('Пожертвование').length }}>
      <h1 className="page-title page-title--bg">Пожертвование</h1>

      {/* Тёмная сцена: слева стих, справа QR-код — главный способ. На телефоне всё в столбик. */}
      <section className="donate-stage">
        <span className="donate-stage-mark" aria-hidden="true">9:7</span>
        <figure className="donate-verse">
          <figcaption className="donate-verse-ref">2 Коринфянам 9:7</figcaption>
          <blockquote>
            <p>Доброхотно дающего любит&nbsp;Бог</p>
          </blockquote>
          <p className="donate-verse-text">
            Отдавать — огромная привилегия: стать участником Божьего дела и послужить Ему тем, чем Он нас
            благословил. Ваш дар — это забота о доме молитвы, поддержка служителей, новые служения и помощь
            тем, кому сейчас нелегко.
          </p>
        </figure>

        {accounts.length > 0 && (
          <div className="donate-qrs">
            {/* Реквизитов может быть несколько: у каждых свой QR-код. */}
            {accounts.map((account) => (
              <figure key={account.id} className="donate-qr">
                <div className="donate-qr-tile">
                  <img src={account.qrCode} alt={t('QR-код для пожертвования')} width="1068" height="1068" />
                </div>
                {/* Телефон: свой экран не отсканировать — картинку сохраняют и открывают в приложении банка. */}
                <figcaption className="donate-qr-caption">
                  <span className="is-desktop">Наведите камеру из приложения банка</span>
                  <span className="is-mobile">Откройте в приложении банка</span>
                </figcaption>
                <a href={`${account.qrCode}?download=1`} download="donation-qr.svg" className="donate-qr-download">Скачать QR-код</a>
              </figure>
            ))}
          </div>
        )}
      </section>

      {(loading || error) && (
        <div className="donate-status"><LoadStatus error={error} onRetry={retry} /></div>
      )}

      {accounts.map((account) => <AccountDetails key={account.id} account={account} copier={copier} />)}
    </div>
  );
}
