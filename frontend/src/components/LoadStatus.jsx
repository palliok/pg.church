// Заглушка на время загрузки данных из API и сообщение, если загрузка не удалась.
export default function LoadStatus({ error, onRetry }) {
  if (!error) {
    return (
      <div role="status" style={{ padding: '56px 20px', textAlign: 'center', font: '500 14px var(--f-body)', color: 'var(--c-gray-text-soft)' }}>
        Загрузка…
      </div>
    );
  }

  return (
    <div role="alert" style={{ padding: '56px 20px', borderRadius: 24, background: 'var(--c-panel)', textAlign: 'center' }}>
      <div style={{ font: '500 14px/1.5 var(--f-body)', color: 'var(--c-gray-text)' }}>Не удалось загрузить данные.</div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="pill-btn" style={{ marginTop: 16, padding: '11px 20px', fontSize: 11.5, background: '#0d0d0d', color: '#fff' }}>
          Повторить
        </button>
      )}
    </div>
  );
}
