import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// Ряд быстрых кнопок под полем адреса + кнопка «+» для настройки
export default function ShortcutChips({ shortcuts, onPick, onAdd }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {shortcuts.map((s) => (
        <TouchableOpacity key={s.id} style={styles.chip} activeOpacity={0.8} onPress={() => onPick(s)}>
          <Ionicons name="bookmark" size={14} color={colors.yellow} style={{ marginRight: 6 }} />
          <Text style={styles.text} numberOfLines={1}>{s.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.chip, styles.add]} activeOpacity={0.8} onPress={onAdd}>
        <Ionicons name="add" size={18} color={colors.yellow} />
        {shortcuts.length === 0 && <Text style={[styles.text, { marginLeft: 4 }]}>Швидка адреса</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginTop: 8 },
  row: { alignItems: 'center', paddingRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, paddingHorizontal: 12, height: 34, marginRight: 8, maxWidth: 180,
  },
  add: { backgroundColor: '#25262f' },
  text: { color: colors.text, fontSize: 14, fontFamily: fonts.medium, flexShrink: 1 },
});
