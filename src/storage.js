// Хранилище быстрых адресов. Нужен пакет @react-native-async-storage/async-storage
// (npx expo install @react-native-async-storage/async-storage + пересборка).
// Если пакета нет — кнопки работают, но пропадают после перезапуска приложения.
const KEY = 'uklon_clone_shortcuts_v1';

let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null;
}

let memory = [];

export async function loadShortcuts() {
  if (!AsyncStorage) return memory;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return memory;
  }
}

export async function saveShortcuts(list) {
  memory = list;
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* не критично */
  }
}
