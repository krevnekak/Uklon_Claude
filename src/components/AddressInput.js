import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export default function AddressInput({
  inputRef, placeholder, value, onChangeText, onFocus, onLocate, onClear, marker, active,
}) {
  return (
    <View style={[styles.row, active && styles.rowActive]}>
      <View style={[styles.dot, marker === 'to' ? styles.dotTo : styles.dotFrom]}>
        <View style={styles.dotInner} />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        returnKeyType="search"
        autoCorrect={false}
      />
      {!!value && (
        <TouchableOpacity onPress={onClear} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onLocate} hitSlop={10} style={styles.locate}>
        <Ionicons name="locate" size={22} color={colors.yellow} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 14, paddingHorizontal: 14, height: 56, borderWidth: 1.5, borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.yellow },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dotFrom: { backgroundColor: colors.yellow },
  dotTo: { backgroundColor: '#fff' },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1c1d26' },
  input: { flex: 1, color: colors.text, fontSize: 16, fontFamily: fonts.medium },
  locate: { marginLeft: 10 },
});
