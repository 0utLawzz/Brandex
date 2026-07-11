import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  useCreateTrademark,
  getListTrademarksQueryKey,
  getGetTrademarkStatsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface FormState {
  tmNo: string;
  appName: string;
  folderNo: string;
  appClass: string;
  stage: string;
  subStage: string;
  city: string;
  date: string;
  isDuplicate: boolean;
  isTm11: boolean;
  notes: string;
}

const INITIAL: FormState = {
  tmNo: '',
  appName: '',
  folderNo: '',
  appClass: '',
  stage: '',
  subStage: '',
  city: '',
  date: '',
  isDuplicate: false,
  isTm11: false,
  notes: '',
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        {label.toUpperCase()}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.input,
            fontFamily: 'SpaceGrotesk_400Regular',
          },
          multiline && styles.textarea,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function Toggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={value ? colors.primaryForeground : colors.mutedForeground}
      />
    </View>
  );
}

export default function NewTrademarkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);

  const set = (key: keyof FormState) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const createMutation = useCreateTrademark({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListTrademarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrademarkStatsQueryKey() });
        setForm(INITIAL);
        router.navigate('/(tabs)/registry');
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to create trademark. Please check required fields.');
      },
    },
  });

  const handleSubmit = () => {
    if (!form.tmNo.trim()) {
      Alert.alert('Required', 'TM Number is required.');
      return;
    }
    if (!form.appName.trim()) {
      Alert.alert('Required', 'Application Name is required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createMutation.mutate({
      tmNo: form.tmNo.trim(),
      appName: form.appName.trim(),
      folderNo: form.folderNo.trim() || null,
      appClass: form.appClass.trim() || null,
      stage: form.stage.trim() || null,
      subStage: form.subStage.trim() || null,
      city: form.city.trim() || null,
      date: form.date.trim() || null,
      notes: form.notes.trim() || null,
      isDuplicate: form.isDuplicate,
      isTm11: form.isTm11,
    });
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === 'web' ? 34 : 100,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          NEW TRADEMARK
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>CORE DETAILS</Text>
        <Field label="TM Number" value={form.tmNo} onChangeText={set('tmNo')} required placeholder="e.g. 12345678" />
        <Field label="Application Name" value={form.appName} onChangeText={set('appName')} required placeholder="Brand / mark name" />
        <Field label="Folder / Case No" value={form.folderNo} onChangeText={set('folderNo')} placeholder="e.g. A-2024-001" />
        <Field label="Class" value={form.appClass} onChangeText={set('appClass')} placeholder="e.g. 25" />
        <Field label="Date" value={form.date} onChangeText={set('date')} placeholder="YYYY-MM-DD" />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>STATUS</Text>
        <Field label="Stage" value={form.stage} onChangeText={set('stage')} placeholder="e.g. Filed, Pending" />
        <Field label="Sub Stage" value={form.subStage} onChangeText={set('subStage')} placeholder="e.g. Under Examination" />
        <Field label="City" value={form.city} onChangeText={set('city')} placeholder="e.g. Delhi" />
        <Toggle label="Duplicate" value={form.isDuplicate} onValueChange={set('isDuplicate') as any} />
        <Toggle label="TM-11 Filed" value={form.isTm11} onValueChange={set('isTm11') as any} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>NOTES</Text>
        <Field label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Additional notes…" multiline />
      </View>

      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: createMutation.isPending ? colors.muted : colors.primary,
            borderColor: colors.border,
          },
        ]}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
        activeOpacity={0.85}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.submitText, { color: colors.primaryForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            CREATE TRADEMARK
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { marginBottom: 16 },
  screenTitle: { fontSize: 24, letterSpacing: -0.5 },
  card: {
    borderWidth: 2,
    padding: 16,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  section: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 14,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toggleLabel: { fontSize: 15 },
  submitBtn: {
    marginTop: 20,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitText: { fontSize: 15, letterSpacing: 1 },
});
