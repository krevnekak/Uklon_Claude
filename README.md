# Uklon Clone (React Native + Expo)

Головний екран: «Звідки» / «Куди» (автопідказки Google Places по Україні + кнопка
«моє місцезнаходження») та початкова ціна. Після знаходження маршруту — екран
як в Uklon: маршрут на Google Maps, тарифи, оплата, «Замовити». Усі кнопки — заглушки,
крім «←», яка повертає на головний екран.

## Запуск

1. `npx create-expo-app@latest uklon-clone --template blank`
2. Скопіюйте в проект файли з цього архіву (з заміною): `App.js`, `index.js`, `app.json`, папку `src/`.
3. `npx expo install react-native-maps expo-location react-native-screens react-native-safe-area-context @react-navigation/native @react-navigation/native-stack @expo/vector-icons expo-status-bar`
4. У Google Cloud Console увімкніть: **Places API, Directions API, Geocoding API,
   Maps SDK for Android, Maps SDK for iOS** і створіть API-ключ.
5. Вставте ключ у `src/config.js` **та** у `app.json` (ios.config.googleMapsApiKey, android.config.googleMaps.apiKey).
6. Запустіть dev-збірку (Expo Go для Google Maps на iOS не підходить):
   - `npx expo run:android`
   - `npx expo run:ios` (потрібен Mac)

## Структура
- `src/screens/HomeScreen.js` — ввід адрес, пошук, ціна
- `src/screens/RideScreen.js` — карта, маршрут, тарифи
- `src/components/AddressInput.js` — поле адреси
- `src/api/google.js` — Places Autocomplete/Details, Geocoding, Directions
- `src/theme/` — кольори і темний стиль карти

## Примітки
- Ціни тарифів рахуються від введеної: Стандарт = ціна, Комфорт = ×1.1, Швидкий пошук = «до» ×1.38.
- Ключ у клієнтському коді можна витягнути — обмежте його по bundle id / package name або проксуйте запити через свій бекенд.
- Іконки авто — з MaterialCommunityIcons; замініть на свої картинки в `assets/`, якщо потрібен точний вигляд.
