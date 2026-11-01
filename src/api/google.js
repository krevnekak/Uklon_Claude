import { GOOGLE_API_KEY as KEY } from '../config';

const PLACES = 'https://places.googleapis.com/v1';
const ROUTES = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json';
const LANG = 'uk';

/** Убираем из адреса страну и индекс: «Хрещатик, Київ, Україна, 02000» → «Хрещатик, Київ» */
const clean = (s = '') =>
  s
    .replace(/,\s*Укра[їи]на\s*(?=,|$)/giu, '')
    .replace(/,\s*\d{5}\s*$/u, '')
    .replace(/\s*,\s*,/g, ',')
    .trim();

async function readJson(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Некоректна відповідь сервера (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error_message || `HTTP ${res.status}`);
  }
  return data;
}

/** Подсказки адресов по Украине (Places API New — places:autocomplete) */
export async function autocomplete(input, bias) {
  const body = {
    input,
    languageCode: LANG,
    includedRegionCodes: ['ua'],
  };
  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.latitude, longitude: bias.longitude },
        radius: 50000,
      },
    };
  }

  const res = await fetch(`${PLACES}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);

  return (data.suggestions || [])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .map((p) => ({
      placeId: p.placeId,
      description: clean(p.text?.text || ''),
      main: p.structuredFormat?.mainText?.text || p.text?.text || '',
      secondary: clean(p.structuredFormat?.secondaryText?.text || ''),
    }));
}

/** Координаты и адрес по place_id (Places API New — Place Details) */
export async function placeDetails(placeId) {
  const id = String(placeId).replace(/^places\//, '');
  const res = await fetch(
    `${PLACES}/places/${encodeURIComponent(id)}?languageCode=${LANG}`,
    {
      headers: {
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'location,formattedAddress,displayName',
      },
    }
  );
  const r = await readJson(res);
  if (!r.location) throw new Error('Не вдалося отримати координати адреси');

  return {
    title: clean(r.formattedAddress || r.displayName?.text || ''),
    lat: r.location.latitude,
    lng: r.location.longitude,
  };
}

/** Адрес по координатам (для «моё местоположение») */
export async function reverseGeocode(lat, lng) {
  const qs = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language: LANG,
    key: KEY,
  }).toString();
  const res = await fetch(`${GEOCODE}?${qs}`);
  const data = await readJson(res);
  if (data.status !== 'OK' || !data.results?.length) return null;
  return clean(data.results[0].formatted_address);
}

/** Маршрут по дорогам (Routes API). Возвращает null, если маршрут не найден */
export async function getRoute(from, to) {
  const res = await fetch(ROUTES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
      destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: LANG,
      units: 'METRIC',
    }),
  });
  const data = await readJson(res);
  const route = data.routes?.[0];
  if (!route?.polyline?.encodedPolyline) return null;

  return {
    coordinates: decodePolyline(route.polyline.encodedPolyline),
    durationSec: Number.parseInt(route.duration || '0', 10),
    distanceM: route.distanceMeters || 0,
  };
}

function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}
