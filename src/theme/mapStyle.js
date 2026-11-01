// Тёмный стиль Google Maps. Иконки, POI (рестораны, магазины и т.д.)
// и транспорт (метро, остановки) ВКЛЮЧЕНЫ — они появляются при приближении.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#14151b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a8a9b3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14151b' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3a3b46' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#17181f' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1b1c24' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9395a5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1d2b24' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f7b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262731' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8e90a0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#33343f' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#222430' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#a8a9b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b2a38' }] },
];