// ТЕСТОВЫЙ РЕЖИМ: после запуска/перезагрузки приложения сразу подставляются
// данные ниже и открывается экран с картой. Для обычной работы поставьте false.
export const TEST_MODE = true;

export const TEST_DATA = {
  from: { title: 'вулиця Хрещатик, 22, Київ', lat: 50.4468, lng: 30.5217 },
  to: { title: 'Контрактова площа, Київ', lat: 50.4661, lng: 30.5159 },
  price: 1053,
  surge: 0, // например 0.5 — чтобы увидеть значок повышенного коэффициента
};

// Запасной маршрут (прямая линия), если Routes API недоступен — чтобы экран
// с картой можно было проверить в любом случае
export function straightRoute(from, to) {
  return {
    coordinates: [
      { latitude: from.lat, longitude: from.lng },
      { latitude: to.lat, longitude: to.lng },
    ],
    durationSec: 12 * 60,
    distanceM: 2500,
  };
}
