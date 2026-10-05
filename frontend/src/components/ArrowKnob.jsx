export default function ArrowKnob({
  size = 40,
  bg = 'var(--c-ink)',
  fg = '#fff',
  symbol = '↗',
  as: As = 'span',
  ...rest
}) {
  return (
    <As
      className="icon-circle"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
        textDecoration: 'none',
        cursor: rest.onClick ? 'pointer' : undefined,
      }}
      {...rest}
    >
      {symbol}
    </As>
  );
}
