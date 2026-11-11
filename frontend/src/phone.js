// Телефон в принятом виде «+7 (911) 123-45-67» — как его отдаёт API (App\Support\Phone).
// Нужен для старых данных из кэша и моков; номер другой страны остаётся как есть.
export function formatPhone(value) {
  if (!value) return value;

  const digits = value.replace(/\D/g, '');
  const plus = value.trim().startsWith('+');
  let national = null;

  if (digits.length === 11 && (digits[0] === '7' || (digits[0] === '8' && !plus))) national = digits.slice(1);
  else if (digits.length === 10 && !plus) national = digits;

  if (!national) return value;

  return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8, 10)}`;
}
