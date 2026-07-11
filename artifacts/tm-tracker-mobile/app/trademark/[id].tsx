import React, { useState, useEffect } from 'react';
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
  useGetTrademark,
  useUpdateTrademark,
  useDeleteTrademark,
  getListTrademarksQueryKey,
  getGetTrademarkStatsQueryKey,
  getGetTrademarkQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        {label.toUpperCase()}
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

export default function TrademarkDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numId = Number(id);

  const { data: trademark, isLoading } = useGetTrademark(numId, {
    query: { enabled: !isNaN(numId) },
  });

  const [form, setForm] = useState<FormState>({
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
  });

  useEffect(() => {
    if (trademark) {
      setForm({
        tmNo: trademark.tmNo ?? '',
        appName: trademark.appName ?? '',
        folderNo: trademark.folderNo ?? '',
        appClass: trademark.appClass ?? '',
        stage: trademark.stage ?? '',
        subStage: trademark.subStage ?? '',
        city: trademark.city ?? '',
        date: trademark.date ?? '',
        isDuplicate: trademark.isDuplicate,
        isTm11: trademark.isTm11,
        notes: trademark.notes ?? '',
      });
    }
  }, [trademark]);

  const set = (key: keyof FormState) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const updateMutation = useUpdateTrademark({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListTrademarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrademarkStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrademarkQueryKey(numId) });
        router.back();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to update trademark.');
      },
    },
  });

  const deleteMutation = useDeleteTrademark({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getListTrademarksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrademarkStatsQueryKey() });
        router.back();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to delete trademark.');
      },
    },
  });

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateMutation.mutate({
      id: numId,
      data: {
        tmNo: form.tmNo.trim() || null,
        appName: form.appName.trim() || null,
        folderNo: form.folderNo.trim() || null,
        appClass: form.appClass.trim() || null,
        stage: form.stage.trim() || null,
        subStage: form.subStage.trim() || null,
        city: form.city.trim() || null,
        date: form.date.trim() || null,
        notes: form.notes.trim() || null,
        isDuplicate: form.isDuplicate,
        isTm11: form.isTm11,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trademark',
      `Are you sure you want to delete "${form.appName || form.tmNo}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteMutation.mutate({ id: numId });
          },
        },
      ]
    );
  };

  const topPad = Platform.OS === 'web' ? 67 : 0; // Stack header handles native insets

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading…', headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.background } }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: form.tmNo || 'Trademark',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: 'SpaceGrotesk_700Bold', color: colors.foreground },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} disabled={deleteMutation.isPending} style={{ marginRight: 4 }}>
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Feather name="trash-2" size={20} color={colors.destructive} />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 34 : 40,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {trademark?.source === 'sheets' && (
          <View style={[styles.sourceBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Feather name="grid" size={13} color={colors.accentForeground} />
            <Text style={[styles.sourceBannerText, { color: colors.accentForeground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
              Synced from Google Sheets
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>CORE DETAILS</Text>
          <Field label="TM Number" value={form.tmNo} onChangeText={set('tmNo')} />
          <Field label="Application Name" value={form.appName} onChangeText={set('appName')} />
          <Field label="Folder / Case No" value={form.folderNo} onChangeText={set('folderNo')} />
          <Field label="Class" value={form.appClass} onChangeText={set('appClass')} />
          <Field label="Date" value={form.date} onChangeText={set('date')} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>STATUS</Text>
          <Field label="Stage" value={form.stage} onChangeText={set('stage')} />
          <Field label="Sub Stage" value={form.subStage} onChangeText={set('subStage')} />
          <Field label="City" value={form.city} onChangeText={set('city')} />
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>Duplicate</Text>
            <Switch
              value={form.isDuplicate}
              onValueChange={set('isDuplicate') as any}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={form.isDuplicate ? colors.primaryForeground : colors.mutedForeground}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>TM-11 Filed</Text>
            <Switch
              value={form.isTm11}
              onValueChange={set('isTm11') as any}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={form.isTm11 ? colors.primaryForeground : colors.mutedForeground}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>NOTES</Text>
          <Field label="Notes" value={form.notes} onChangeText={set('notes')} multiline />
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor: updateMutation.isPending ? colors.muted : colors.primary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
              SAVE CHANGES
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    padding: 10,
    marginBottom: 14,
  },
  sourceBannerText: { fontSize: 13 },
  card: {
    borderWidth: 2,
    padding: 16,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  section: { fontSize: 10, letterSpacing: 1, marginBottom: 14 },
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
  saveBtn: {
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
  saveBtnText: { fontSize: 15, letterSpacing: 1 },
});
