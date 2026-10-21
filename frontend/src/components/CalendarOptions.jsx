// Значок «скопировать»: два листа. Текстовых символов для него в шрифтах сайта нет.
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </svg>
);

// Варианты добавления в календарь: ссылки (Google, Outlook, файл .ics) и кнопки
// (например, «скопировать ссылку»). Каждый вариант — { label, hint?, href?, onClick?, external? }.
export default function CalendarOptions({ options, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, ...style }}>
      {options.map((option) => {
        const content = (
          <>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: '600 14px var(--f-sans)' }}>{option.label}</span>
              {option.hint && <span style={{ display: 'block', font: '500 12px var(--f-sans)', color: 'var(--c-gray-text)', marginTop: 2 }}>{option.hint}</span>}
            </span>
            <span aria-hidden="true" style={{ display: 'inline-flex', color: 'var(--c-gray-text-mute)' }}>{option.href ? '↗' : <CopyIcon />}</span>
          </>
        );
        const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', border: 'none', borderRadius: 14, background: '#fff', color: '#231f20', textAlign: 'left', cursor: 'pointer' };

        return option.href ? (
          <a key={option.label} href={option.href} style={rowStyle} {...(option.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {content}
          </a>
        ) : (
          <button key={option.label} type="button" onClick={option.onClick} style={rowStyle}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
