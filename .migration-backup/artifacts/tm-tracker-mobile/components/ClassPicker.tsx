import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface ClassPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const CLASS_OPTIONS = Array.from({ length: 45 }, (_, i) => String(i + 1));

export function ClassPicker({ value, onChange, label = 'Class' }: ClassPickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        {label.toUpperCase()}
      </Text>
      <TouchableOpacity
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.input }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={[styles.value, { color: value ? colors.foreground : colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
          {value || 'Select class 1–45'}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                SELECT CLASS
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Feather name="x" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.options}>
              {CLASS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    value === opt && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: value === opt ? colors.primaryForeground : colors.foreground,
                        fontFamily: value === opt ? 'SpaceGrotesk_700Bold' : 'SpaceGrotesk_400Regular',
                      },
                    ]}
                  >
                    Class {opt}
                  </Text>
                  {value === opt && (
                    <Feather name="check" size={16} color={colors.primaryForeground} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  value: { fontSize: 15 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopWidth: 2,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
  },
  sheetTitle: { fontSize: 16, letterSpacing: 0.5 },
  options: { paddingHorizontal: 16, paddingBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: 15 },
});
