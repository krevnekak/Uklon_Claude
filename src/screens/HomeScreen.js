import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Keyboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AddressInput from '../components/AddressInput';
import { autocomplete, placeDetails, reverseGeocode, getRoute } from '../api/google';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export default function HomeScreen({ navigation }) {
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(null); // 'from' | 'to'
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toRef = useRef(null);
  const bias = useRef(null);

  // Автоподгрузка подсказок (debounce 300 мс)
  useEffect(() => {
    const text = active === 'from' ? fromText : active === 'to' ? toText : '';
    const place = active === 'from' ? fromPlace : toPlace;
    if (!active || place || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await autocomplete(text.trim(), bias.current);
        if (!cancelled) {
          setSuggestions(res);
          setError(res.length ? '' : 'Нічого не знайдено');
        }
      } catch (e) {
        console.warn('autocomplete error:', e);
        if (!cancelled) {
          setSuggestions([]);
          setError(`Підказки: ${e.message}`);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [active, fromText, toText, fromPlace, toPlace]);

  const onChange = (field, text) => {
    setError('');
    if (field === 'from') { setFromText(text); setFromPlace(null); }
    else { setToText(text); setToPlace(null); }
  };

  const applyPlace = (field, place) => {
    if (field === 'from') { setFromPlace(place); setFromText(place.title); }
    else { setToPlace(place); setToText(place.title); }
    setSuggestions([]);
  };

  const pickSuggestion = async (s) => {
    const field = active;
    try {
      setSearching(true);
      const place = await placeDetails(s.placeId);
      applyPlace(field, place);
      if (field === 'from' && !toPlace) setTimeout(() => toRef.current?.focus(), 50);
      else Keyboard.dismiss();
    } catch (e) {
      console.warn('placeDetails error:', e);
      setError(`Адреса: ${e.message}`);
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = async (field) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Немає доступу', 'Дозвольте доступ до геолокації в налаштуваннях.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      bias.current = { latitude, longitude };
      const address = (await reverseGeocode(latitude, longitude)) || 'Моє місцезнаходження';
      applyPlace(field, { title: address, lat: latitude, lng: longitude });
      Keyboard.dismiss();
    } catch (e) {
      setError('Не вдалося визначити місцезнаходження.');
    }
  };

  const priceNum = Number(price.replace(',', '.'));
  const canSearch = !!fromPlace && !!toPlace && priceNum > 0 && !loading;

  const onSearch = async () => {
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const route = await getRoute(fromPlace, toPlace);
      if (!route) {
        setError('Маршрут не знайдено. Перевірте адреси.');
        return;
      }
      navigation.navigate('Ride', { from: fromPlace, to: toPlace, price: Math.round(priceNum), route });
    } catch (e) {
      console.warn('route error:', e);
      setError(`Маршрут: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>Куди їдемо?</Text>

        <AddressInput
          marker="from"
          placeholder="Звідки"
          value={fromText}
          active={active === 'from'}
          onFocus={() => setActive('from')}
          onChangeText={(t) => onChange('from', t)}
          onClear={() => onChange('from', '')}
          onLocate={() => useMyLocation('from')}
        />
        <View style={{ height: 10 }} />
        <AddressInput
          inputRef={toRef}
          marker="to"
          placeholder="Куди"
          value={toText}
          active={active === 'to'}
          onFocus={() => setActive('to')}
          onChangeText={(t) => onChange('to', t)}
          onClear={() => onChange('to', '')}
          onLocate={() => useMyLocation('to')}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        {(suggestions.length > 0 || searching) && (
          <View style={styles.suggestions}>
            {searching && suggestions.length === 0 && <ActivityIndicator color={colors.yellow} style={{ padding: 16 }} />}
            {suggestions.map((s) => (
              <TouchableOpacity key={s.placeId} style={styles.suggestion} onPress={() => pickSuggestion(s)}>
                <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sMain} numberOfLines={1}>{s.main}</Text>
                  {!!s.secondary && <Text style={styles.sSub} numberOfLines={1}>{s.secondary}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Ваша ціна</Text>
        <View style={styles.priceRow}>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.,]/g, ''))}
            onFocus={() => setActive(null)}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <Text style={styles.currency}>₴</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !canSearch && styles.buttonDisabled]}
          disabled={!canSearch}
          onPress={onSearch}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#1c1d26" /> : <Text style={styles.buttonText}>Знайти авто</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 24 },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.accent, marginBottom: 20 },
  suggestions: { backgroundColor: colors.sheet, borderRadius: 14, marginTop: 10, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  sMain: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold },
  sSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
  label: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, marginTop: 24, marginBottom: 8 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 14, paddingHorizontal: 16, height: 56,
  },
  priceInput: { flex: 1, color: colors.text, fontSize: 22, fontFamily: fonts.accent },
  currency: { color: colors.yellow, fontSize: 22, fontFamily: fonts.accent },
  error: { color: colors.danger, marginTop: 12, fontSize: 14, fontFamily: fonts.regular },
  button: {
    backgroundColor: colors.yellow, height: 58, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', marginTop: 28,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#1c1d26', fontSize: 22, fontFamily: fonts.accent },
});
