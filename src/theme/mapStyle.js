// Тёмный стиль карты под оригинальный Uklon (цвета сняты со скриншотов оригинала).
// Городская застройка светлее (#181818), природные территории почти чёрные (#0d0d0d),
// дороги заметно ярче, парки зелёные, вода бирюзово-тёмная.
// Места (POI), иконки и метро включены явно.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a9a9a9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d0d' }] },

  // Границы и названия территорий
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3b3b3f' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d4d4d4' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },

  // Суша: застройка светлее, природа темнее
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#121212' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },

  // Места (POI) и парки — показываем явно
  { featureType: 'poi', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#33503f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#8fb59f' }] },

  // Дороги — ярче, чем раньше
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#343434' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#424242' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8f8f8f' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d0d' }] },

  // Транспорт (метро, остановки)
  { featureType: 'transit', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#242424' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#b5b5b5' }] },

  // Вода
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#043f53' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5b8896' }] },
];