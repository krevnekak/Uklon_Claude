import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { autocomplete, placeDetails } from '../api/google';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const SHEET_BG = '#2D3037';
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function ShortcutsModal({ visible, onClose, shortcuts, onChange }) {
  const insets = useSafeAreaInsets();
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('');
  const [addrText, setAddrText] = useState('');
  const [place, setPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEditingId(null);
    setLabel('');
    setAddrText('');
    setPlace(null);
    setSuggestions([]);
    setError('');
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  // Подсказки адресов (debounce 300 мс), поиск по Украине
  useEffect(() => {
    if (!visible || place || addrText.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setBusy(true);
        const r = await autocomplete(addrText.trim());
        if (!cancelled) {
          setSuggestions(r.slice(0, 5));
          setError(r.length ? '' : 'Нічого не знайдено');
        }
      } catch (e) {
        if (!cancelled) {
          setSuggestions([]);
          setError(`Підказки: ${e.message}`);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, addrText, place]);

  const pick = async (s) => {
    try {
      setBusy(true);
      const d = await placeDetails(s.placeId);
      setPlace(d);
      setAddrText(d.title);
      setSuggestions([]);
      setError('');
    } catch (e) {
      setError(`Адреса: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!label.trim()) return setError('Введіть назву кнопки');
    if (!place) return setError('Оберіть адресу зі списку підказок');
    const item = { id: editingId || newId(), label: label.trim(), place };
    const list = editingId
      ? shortcuts.map((s) => (s.id === editingId ? item : s))
      : [...shortcuts, item];
    onChange(list);
    reset();
  };

  const edit = (s) => {
    setEditingId(s.id);
    setLabel(s.label);
    setAddrText(s.place.title);
    setPlace(s.place);
    setSuggestions([]);
    setError('');
  };

  const remove = (id) => {
    onChange(shortcuts.filter((s) => s.id !== id));
    if (editingId === id) reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Швидкі адреси</Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {shortcuts.length === 0 && (
                <Text style={styles.empty}>
                  Поки немає кнопок. Додайте, наприклад, «Робота» або «Дім» — вони з'являться
                  під полями «Звідки» та «Куди».
                </Text>
              )}

              {shortcuts.map((s) => (
                <View key={s.id} style={styles.item}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => edit(s)} activeOpacity={0.7}>
                    <Text style={styles.itemLabel} numberOfLines={1}>{s.label}</Text>
                    <Text style={styles.itemAddr} numberOfLines={1}>{s.place.title}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => edit(s)} hitSlop={8} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(s.id)} hitSlop={8} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.formTitle}>{editingId ? 'Редагувати кнопку' : 'Нова кнопка'}</Text>

              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Назва (наприклад, Робота)"
                placeholderTextColor={colors.textMuted}
                maxLength={20}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={addrText}
                onChangeText={(t) => { setAddrText(t); setPlace(null); setError(''); }}
                placeholder="Адреса"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
              />

              {(suggestions.length > 0 || busy) && (
                <View style={styles.suggestions}>
                  {busy && suggestions.length === 0 && <ActivityIndicator color={colors.yellow} style={{ padding: 12 }} />}
                  {suggestions.map((s) => (
                    <TouchableOpacity key={s.placeId} style={styles.suggestion} onPress={() => pick(s)}>
                      <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.sMain} numberOfLines={1}>{s.main}</Text>
                        {!!s.secondary && <Text style={styles.sSub} numberOfLines={1}>{s.secondary}</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.buttons}>
                {editingId && (
                  <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={reset} activeOpacity={0.8}>
                    <Text style={styles.btnGhostText}>Скасувати</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btn, styles.btnMain]} onPress={save} activeOpacity={0.8}>
                  <Text style={styles.btnMainText}>{editingId ? 'Зберегти' : 'Додати кнопку'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: SHEET_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 16, maxHeight: Dimensions.get('window').height * 0.85,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#fff', fontSize: 20, fontFamily: fonts.accent },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular, marginBottom: 12, lineHeight: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  itemLabel: { color: '#fff', fontSize: 16, fontFamily: fonts.semibold },
  itemAddr: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 2 },
  iconBtn: { paddingLeft: 14 },
  formTitle: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium, marginTop: 14, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, height: 48, paddingHorizontal: 14,
    color: '#fff', fontSize: 16, fontFamily: fonts.medium,
  },
  suggestions: { backgroundColor: '#25262f', borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  sMain: { color: '#fff', fontSize: 14, fontFamily: fonts.semibold },
  sSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular, marginTop: 1 },
  error: { color: colors.danger, fontSize: 13, fontFamily: fonts.regular, marginTop: 8 },
  buttons: { flexDirection: 'row', marginTop: 14 },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnMain: { backgroundColor: colors.yellow },
  btnMainText: { color: '#1c1d26', fontSize: 17, fontFamily: fonts.accent },
  btnGhost: { backgroundColor: '#25262f', marginRight: 8 },
  btnGhostText: { color: '#fff', fontSize: 16, fontFamily: fonts.medium },
});
