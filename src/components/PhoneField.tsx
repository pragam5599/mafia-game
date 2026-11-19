import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { COUNTRIES, type Country } from '@/data/countries';
import { colors, radius, spacing, type, withAlpha } from '@/theme';
import { Button } from './Button';
import { Input } from './Input';
import { Text } from './Text';

// A1 phone number: country-code picker + number, built on the Input component.
type Props = {
  country: Country;
  onCountryChange: (c: Country) => void;
  number: string;
  onNumberChange: (n: string) => void;
  helper: string;
  error?: string | null;
  onSubmit?: () => void;
};

export function PhoneField({ country, onCountryChange, number, onNumberChange, helper, error, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)) : COUNTRIES;
  }, [query]);

  return (
    <>
      <Input
        label="Phone number"
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        value={number}
        onChangeText={(t) => onNumberChange(t.replace(/[^\d ]/g, ''))}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        state={error ? 'error' : 'default'}
        helper={error ?? helper}
        leading={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dial}, ${country.name}. Change`}
            onPress={() => setOpen(true)}
            hitSlop={8}
          >
            <Text variant="bodyM">{country.dial}</Text>
          </Pressable>
        }
      />
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text variant="displayM">Country code</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.text.muted}
              selectionColor={colors.highlight.default}
              style={styles.search}
              autoCorrect={false}
            />
            <FlatList
              data={list}
              keyExtractor={(c) => `${c.name}${c.dial}`}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => {
                    onCountryChange(item);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Text variant="bodyM" style={styles.rowName}>
                    {item.name}
                  </Text>
                  <Text variant="bodyM" color={colors.text.secondary}>
                    {item.dial}
                  </Text>
                </Pressable>
              )}
            />
            <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: withAlpha(colors.bg.base, 0.85), justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    gap: spacing.md,
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  search: {
    ...type.bodyM,
    lineHeight: undefined,
    height: 44,
    paddingHorizontal: spacing.lg,
    color: colors.text.primary,
    backgroundColor: colors.bg.raised,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.sm,
  },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  rowPressed: { opacity: 0.6 },
  rowName: { flex: 1 },
});
