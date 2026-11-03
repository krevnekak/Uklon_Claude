// Необязательно: ID карты из Google Cloud (Map Management → Map IDs).
// Если указан, подписи/иконки/POI рисует «векторная» карта Google, где мест
// заметно больше и они появляются раньше — как в оригинальном Uklon.
// Когда ID задан, локальный стиль из theme/mapStyle.js НЕ используется
// (стиль берётся из Google Cloud, см. инструкцию).
// Пустая строка = обычная карта со стилем из mapStyle.js.
import { Platform } from 'react-native';

export const MAP_ID_ANDROID = '';
export const MAP_ID_IOS = '';

export const GOOGLE_MAP_ID = Platform.OS === 'ios' ? MAP_ID_IOS : MAP_ID_ANDROID;
