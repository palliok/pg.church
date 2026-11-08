// Ссылки на Яндекс Карты.
// Церковь открываем карточкой организации: на телефоне она сразу открывается в приложении
// с названием, фото и маршрутом. Поиск по голому адресу показывает безымянную точку.
export const CHURCH_MAP_URL = 'https://yandex.ru/maps/org/54522682685/';

// «Большая Озёрная, 27» и «большая озерная 27» — один адрес.
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');

// Ссылка на место события: адрес церкви — карточка церкви, другой адрес — поиск с городом,
// чтобы Яндекс не искал улицу с таким названием в другом месте.
export function placeMapUrl(addr, church) {
  if (!addr) return null;
  if (church?.address && norm(addr) === norm(church.address)) return CHURCH_MAP_URL;
  const city = church?.city && !norm(addr).includes(norm(church.city)) ? `${church.city}, ` : '';
  return `https://yandex.ru/maps/?text=${encodeURIComponent(city + addr)}`;
}
