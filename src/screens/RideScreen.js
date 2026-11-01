import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { darkMapStyle } from '../theme/mapStyle';

const { width: SCREEN_W } = Dimensions.get('window');
const BUBBLE_W = 190;
const BUBBLE_H = 58;
const DOT = 22;
const PLUS = 36;

// В Expo Go на iOS Google Maps недоступны (карта будет пустой) — там используем Apple Maps.
// В dev/production-сборках (EAS) и на Android везде работает Google Maps.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const MAP_PROVIDER = Platform.OS === 'ios' && IS_EXPO_GO ? undefined : PROVIDER_GOOGLE;

const SHEET_BG = '#2D3037'; // фон шторки = фон картинок авто

// Тарифы. k — коэффициент к начальной цене (Стандарт = введённая цена).
// Для «Бізнес» и «Прайм» коэффициенты подобраны наугад — поправьте под себя.
const TARIFF_DEFS = [
  { id: 'fast', name: 'Швидкий пошук', k: 1.38, upTo: true, image: require('../../assets/tariffs/uklon_quick_search.png') },
  { id: 'standard', name: 'Стандарт', k: 1, image: require('../../assets/tariffs/uklon_standard.png') },
  { id: 'comfort', name: 'Комфорт', k: 1.1, image: require('../../assets/tariffs/uklon_comfort.png') },
  { id: 'business', name: 'Бізнес', k: 1.5, image: require('../../assets/tariffs/uklon_business.png') },
  { id: 'prime', name: 'Прайм', k: 1.9, image: require('../../assets/tariffs/uklon_prime.png') },
];

const pad = (n) => String(n).padStart(2, '0');
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function Tariff({ item, selected, onPress }) {
  return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.tariff, selected && styles.tariffSelected]}>
        <View style={styles.carBox}>
          <Image source={item.image} style={styles.carImg} resizeMode="contain" />
        </View>
        <View style={styles.tInfo}>
          <Text style={styles.tName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.tMeta}>
            <Ionicons name="person-outline" size={15} color={colors.textMuted} />
            <Text style={styles.tMetaText} numberOfLines={1}>{'  4  •  Через 3 хв'}</Text>
          </View>
        </View>
        <Text style={styles.tPrice} numberOfLines={1}>{item.price}</Text>
      </TouchableOpacity>
  );
}

function Dot({ x, y, color }) {
  return (
      <View pointerEvents="none" style={[styles.dot, { left: x - DOT / 2, top: y - DOT / 2, backgroundColor: color }]}>
        <View style={styles.dotInner} />
      </View>
  );
}

function Bubble({ left, top, title, sub }) {
  return (
      <View pointerEvents="none" style={[styles.bubble, { left, top }]}>
        <Text style={styles.bubbleTitle} numberOfLines={1} ellipsizeMode="middle">{title}</Text>
        <View style={styles.bubbleDivider} />
        <Text style={styles.bubbleSub} numberOfLines={1}>{sub}</Text>
      </View>
  );
}

export default function RideScreen({ navigation, route: navRoute }) {
  const { from, to, price, route } = navRoute.params;
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [selected, setSelected] = useState('standard');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [pts, setPts] = useState(null); // экранные координаты точек A и B
  const [mapSize, setMapSize] = useState({ w: SCREEN_W, h: 500 });
  const inView = (p) =>
      p.x > -DOT && p.x < mapSize.w + DOT && p.y > -DOT && p.y < mapSize.h + DOT;
  const rectVisible = (l, t, w, h) => l + w > 0 && l < mapSize.w && t + h > 0 && t < mapSize.h;

  const origin = useMemo(() => ({ latitude: from.lat, longitude: from.lng }), [from]);
  const dest = useMemo(() => ({ latitude: to.lat, longitude: to.lng }), [to]);

  const tariffs = useMemo(
      () =>
          TARIFF_DEFS.map((t) => ({
            ...t,
            price: `${t.upTo ? 'до ' : ''}${fmt(price * t.k)} ₴`,
          })),
      [price]
  );
  const selectedTariff = tariffs.find((t) => t.id === selected) || tariffs[0];
  const isFast = selected === 'fast';

  const arrival = useMemo(() => {
    const d = new Date(Date.now() + (route.durationSec + 3 * 60) * 1000);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [route]);

  // Переводим координаты в экранные, чтобы рисовать точки и бабблы поверх карты
  const busy = useRef(false);
  const dirty = useRef(false);
  const mapSizeRef = useRef({ w: SCREEN_W, h: 500 });
  const lonRef = useRef(null); // текущий масштаб (longitudeDelta не зависит от широты)
  const lastLon = useRef(null); // масштаб, при котором считали смещения плашек
  const offs = useRef(null); // горизонтальные смещения плашек относительно точек

  // Горизонтальный сдвиг плашки относительно «по центру над/под точкой».
  // Сдвиг нужен только чтобы плашка не вылезала за край экрана, и он ОГРАНИЧЕН:
  // точка всегда остаётся под/над плашкой. Если точка вне экрана — сдвига нет вообще.
  const MAX_SHIFT = BUBBLE_W / 2 - 18;
  const shiftFor = (x, width) => {
    const { w } = mapSizeRef.current;
    if (x < 0 || x > w) return 0;
    const centered = x - BUBBLE_W / 2;
    const left = clamp(centered, 12, w - 12 - width);
    return clamp(left - centered, -MAX_SHIFT, MAX_SHIFT);
  };
  const computeOffsets = (a, b) => ({
    b: shiftFor(b.x, BUBBLE_W + 8 + PLUS), // плашка B + кнопка «+»
    a: shiftFor(a.x, BUBBLE_W),
  });

  const updatePoints = useCallback(async (region) => {
    if (region?.longitudeDelta) lonRef.current = region.longitudeDelta;
    if (!mapRef.current) return;
    if (busy.current) {
      dirty.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        dirty.current = false;
        const [a, b] = await Promise.all([
          mapRef.current.pointForCoordinate(origin),
          mapRef.current.pointForCoordinate(dest),
        ]);
        if (a && b) {
          const lon = lonRef.current;
          const zoomChanged =
              lastLon.current == null ||
              (lon != null && Math.abs(lon - lastLon.current) / lastLon.current > 0.005);
          // При перетаскивании плашки едут вместе с точками как есть;
          // заново «подтягиваем» их к точкам только когда изменился масштаб.
          if (!offs.current || zoomChanged) {
            offs.current = computeOffsets(a, b);
            if (lon != null) lastLon.current = lon;
          }
          setPts({ a, b });
        }
      } while (dirty.current);
    } catch (e) {
      /* карта ещё не готова */
    } finally {
      busy.current = false;
    }
  }, [origin, dest]);

  const fit = useCallback(() => {
    mapRef.current?.fitToCoordinates(route.coordinates, {
      edgePadding: { top: insets.top + 110, right: 70, bottom: 90, left: 70 },
      animated: false,
    });
    setTimeout(updatePoints, 300);
  }, [route, insets.top, updatePoints]);

  useEffect(() => {
    const t = setTimeout(updatePoints, 600);
    return () => clearTimeout(t);
  }, [updatePoints]);

  // Диагностика: карта не загрузилась за 10 с — обычно проблема с ключом Google Maps SDK
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mapLoaded) {
        console.warn('[Map] onMapLoaded не сработал за 10 с — проверьте ключ и Maps SDK for Android/iOS');
        setMapFailed(true);
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [mapLoaded]);

  const payLabel = Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay';

  // Плашки жёстко привязаны к точкам: B — над точкой (+ кнопка «+» справа), A — под точкой
  const groupW = BUBBLE_W + 8 + PLUS;
  let destPos = null;
  let originPos = null;
  if (pts && offs.current) {
    const dl = pts.b.x + offs.current.b;
    const dt = pts.b.y - DOT / 2 - 6 - BUBBLE_H;
    const ol = pts.a.x + offs.current.a;
    const ot = pts.a.y + DOT / 2 + 6;
    if (inView(pts.b) || rectVisible(dl, dt, groupW, BUBBLE_H)) destPos = { l: dl, t: dt };
    if (inView(pts.a) || rectVisible(ol, ot, BUBBLE_W, BUBBLE_H)) originPos = { l: ol, t: ot };
  }

  return (
      <View style={styles.root}>
        <View
            style={styles.mapWrap}
            onLayout={(e) => {
              const size = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
              mapSizeRef.current = size;
              setMapSize(size);
            }}
        >
          <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={MAP_PROVIDER}
              userInterfaceStyle="dark"
              customMapStyle={darkMapStyle}
              toolbarEnabled={false}
              showsCompass={false}
              mapPadding={{ top: 0, left: 0, right: 0, bottom: 46 }}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
              pitchEnabled={false}
              onMapReady={() => setTimeout(fit, 100)}
              onMapLoaded={() => { setMapLoaded(true); setMapFailed(false); }}
              onRegionChange={(r) => updatePoints(r)}
              onRegionChangeComplete={(r) => updatePoints(r)}
              initialRegion={{ ...origin, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
          >
            <Polyline coordinates={route.coordinates} strokeColor="#ffffff" strokeWidth={4} zIndex={1} />
            {/*<Polyline coordinates={route.coordinates} strokeColor="#ffffff" strokeWidth={2} zIndex={2} />*/}
          </MapView>

          {mapFailed && !mapLoaded && (
              <View style={styles.mapError} pointerEvents="none">
                <Text style={styles.mapErrorText}>
                  Карта не завантажилась.{'\n'}Перевірте API-ключ і чи увімкнено Maps SDK for {Platform.OS === 'ios' ? 'iOS' : 'Android'}.
                </Text>
              </View>
          )}

          {destPos && (
              <>
                <Dot x={pts.b.x} y={pts.b.y} color="#fff" />
                <Bubble left={destPos.l} top={destPos.t} title={to.title} sub={`Приїдемо о ${arrival}`} />
                {/* «+» прикреплён к плашке конечной точки (заглушка) */}
                <TouchableOpacity
                    style={[styles.plus, { left: destPos.l + BUBBLE_W + 8, top: destPos.t }]}
                    activeOpacity={0.8}
                >
                  <Ionicons name="add" size={26} color="#1c1d26" />
                </TouchableOpacity>
              </>
          )}
          {originPos && (
              <>
                <Dot x={pts.a.x} y={pts.a.y} color={colors.yellow} />
                <Bubble left={originPos.l} top={originPos.t} title={from.title} sub="Буде через 3 хв" />
              </>
          )}

          {/* «Назад» — возвращает на главный экран */}
          <TouchableOpacity
              style={[styles.back, { top: insets.top + 8 }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          {/* Чипы (заглушки) */}
          <View style={styles.chips} pointerEvents="box-none">
            {['Коментар', 'Їду я', 'Додаткові послуги'].map((t) => (
                <TouchableOpacity key={t} style={styles.chip} activeOpacity={0.8}>
                  <Text style={styles.chipText} numberOfLines={1}>{t}</Text>
                </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <View style={styles.handle} />

          <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
          >
            {tariffs.map((t) => (
                <Tariff key={t.id} item={t} selected={selected === t.id} onPress={() => setSelected(t.id)} />
            ))}
          </ScrollView>

          {/*<View style={styles.promo}>*/}
          {/*  <Text style={styles.promoText} numberOfLines={1}>Ще 1 поїздка і +20 </Text>*/}
          {/*  <MaterialCommunityIcons name="circle-multiple" size={20} color="#E8A800" />*/}
          {/*</View>*/}

          <View style={styles.payRow}>
            <TouchableOpacity style={styles.pay} activeOpacity={0.8}>
              <View style={styles.payBadge}>
                <Ionicons name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google'} size={14} color="#000" />
                <Text style={styles.payBadgeText}>Pay</Text>
              </View>
              <Text style={styles.payText} numberOfLines={1}>{payLabel}</Text>
              <Ionicons name="chevron-forward" size={12} style={{marginTop: 2}} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePrice} activeOpacity={0.8}>
              <Text style={styles.changePriceText} numberOfLines={1}>Змінити ціну</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.order}>
            {/* Нажимаемая область всей кнопки */}
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.8} />

            {/* «Замовити» — строго по центру всей кнопки, не зависит от иконки календаря */}
            <View style={styles.orderCenter} pointerEvents="none">
              <Text style={styles.orderText}>Замовити</Text>
              {/* Цена — абсолютно под надписью, поэтому надпись не сдвигается */}
              {isFast && <Text style={styles.orderPrice}>{selectedTariff.price}</Text>}
            </View>

            {!isFast && (
                <>
                  <View style={styles.orderDivider} />
                  <TouchableOpacity style={styles.orderSchedule} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="calendar-clock-outline" size={26} color="#1c1d26" />
                  </TouchableOpacity>
                </>
            )}
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  mapWrap: { flex: 1, overflow: 'hidden' },
  mapError: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  mapErrorText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },

  back: {
    position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#25262f', alignItems: 'center', justifyContent: 'center',
  },
  plus: {
    position: 'absolute', width: PLUS, height: PLUS, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },

  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#1c1d26' },
  bubble: {
    position: 'absolute', width: BUBBLE_W, height: BUBBLE_H, backgroundColor: '#2a2b35',
    borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center',
  },
  bubbleTitle: { color: '#fff', fontSize: 13, fontFamily: fonts.medium },
  bubbleDivider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: '#41424e', marginVertical: 6 },
  bubbleSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular },

  chips: { position: 'absolute', left: 8, right: 12, bottom: 10, flexDirection: 'row' },
  chip: {
    backgroundColor: colors.chip, borderRadius: 12, paddingHorizontal: 14, height: 36,
    justifyContent: 'center', marginRight: 8,
  },
  chipText: { color: '#fff', fontSize: 14, fontFamily: fonts.medium },

  sheet: {
    backgroundColor: SHEET_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 12, paddingTop: 8,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#4a4c5a', marginBottom: 10 },

  list: { height: 172, flexGrow: 0 },
  tariff: {
    flexDirection: 'row', alignItems: 'center', height: 72, borderRadius: 14,
    paddingHorizontal: 12, borderWidth: 2, borderColor: 'transparent',
  },
  tariffSelected: { borderColor: colors.yellow },
  carBox: { width: 60, height: 38, justifyContent: 'center', marginRight: 8 },
  carImg: { width: 60, height: 36 },
  tInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  tName: { color: '#fff', fontSize: 14, fontFamily: fonts.semibold },
  tMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  tMetaText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, flexShrink: 1 },
  tPrice: { color: '#fff', fontSize: 14, fontFamily: fonts.semibold, flexShrink: 0 },

  promo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.yellowSoft,
    borderRadius: 14, paddingHorizontal: 14, height: 40, marginTop: 6,
  },
  promoText: { color: '#1c1d26', fontSize: 16, fontFamily: fonts.accent, flexShrink: 1 },

  payRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  pay: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  payBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 0,
    paddingHorizontal: 2, height: 16, marginRight: 8,
  },
  payBadgeText: { color: '#000', fontSize: 6, fontFamily: fonts.semibold, marginLeft: 2 },
  payText: { color: '#fff', fontSize: 12, fontFamily: fonts.medium, flexShrink: 1, marginRight: 2 },
  changePrice: {
    flexShrink: 0, backgroundColor: '#1c1d25', borderRadius: 10, paddingHorizontal: 16,
    height: 34, justifyContent: 'center',
  },
  changePriceText: { color: '#fff', fontSize: 12, fontFamily: fonts.medium },

  order: {
    backgroundColor: colors.yellow, borderRadius: 18, height: 64, marginTop: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  orderText: {
    color: '#1c1d26', fontSize: 22, lineHeight: 26, fontFamily: fonts.medium,
    includeFontPadding: false, textAlignVertical: 'center',
  },
  orderPrice: {
    textAlign: 'center',
    color: 'rgba(28,29,38,0.8)', fontSize: 13, lineHeight: 14, fontFamily: fonts.medium,
    includeFontPadding: false,
    marginTop: 5
  },
  orderDivider: { position: 'absolute', right: 64, top: 18, width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.25)' },
  orderSchedule: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 64, alignItems: 'center', justifyContent: 'center' },
});