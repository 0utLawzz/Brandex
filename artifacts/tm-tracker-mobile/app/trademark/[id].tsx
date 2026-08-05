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
  useGetTrademarkChangeLog,
  getListTrademarksQueryKey,
  getGetTrademarkStatsQueryKey,
  getGetTrademarkQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ClassPicker } from '@/components/ClassPicker';
import { Feather } from '@expo/vector-icons';

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const base = value ? new Date(`${value}T00:00:00`) : new Date();
  const [month, setMonth] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, index) => index < first ? null : index - first + 1);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>FILING DATE</Text>
      <TouchableOpacity style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={() => setVisible(true)}>
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground }}>{value || 'SELECT DATE'}</Text>
      </TouchableOpacity>
      {visible && (
        <View style={[styles.calendar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Feather name="chevron-left" size={18} color={colors.foreground} /></TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: colors.foreground }]}>{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Feather name="chevron-right" size={18} color={colors.foreground} /></TouchableOpacity>
          </View>
          <View style={styles.calendarGrid}>
            {['S','M','T','W','T','F','S'].map((day, index) => <Text key={`${day}-${index}`} style={[styles.calendarDay, { color: colors.mutedForeground }]}>{day}</Text>)}
            {cells.map((day, index) => day ? (
              <TouchableOpacity key={day} style={styles.calendarCell} onPress={() => { onChange(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`); setVisible(false); }}>
                <Text style={[styles.calendarCellText, { color: colors.foreground }]}>{day}</Text>
              </TouchableOpacity>
            ) : <View key={`empty-${index}`} style={styles.calendarCell} />)}
          </View>
        </View>
      )}
    </View>
  );
}

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
  const [showLog, setShowLog] = useState(false);

  const { data: trademark, isLoading } = useGetTrademark(numId, {
    query: { queryKey: ['trademark', numId], enabled: !isNaN(numId) },
  });

  const { data: changeLog, isLoading: logLoading } = useGetTrademarkChangeLog(numId, {
    query: { queryKey: ['changelog', numId], enabled: !isNaN(numId) && showLog },
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
        isDuplicate: trademark.isDuplicate === true,
        isTm11: trademark.isTm11 === true,
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

  const transfer = async (target: 'local' | 'sheets') => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const response = await fetch(`${domain ? `https://${domain}` : ''}/api/trademarks/${numId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    });
    const payload = await response.json();
    Alert.alert(response.ok ? 'Source updated' : 'Transfer failed', payload.message || payload.error);
  };

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
        <View style={[styles.recordSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summarySource, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            {trademark?.source === 'sheets' ? 'SHEET RECORD' : 'DATABASE RECORD'}
          </Text>
          <Text style={[styles.summaryStage, { color: colors.foreground }]}>
            STAGE: {trademark?.stage || '—'}  ·  SUB-STAGE: {trademark?.subStage || '—'}
          </Text>
          <View style={styles.transferRow}>
            <TouchableOpacity style={[styles.transferButton, { borderColor: colors.border }]} onPress={() => transfer('sheets')}>
              <Text style={[styles.transferText, { color: colors.foreground }]}>MOVE TO SHEET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.transferButton, { borderColor: colors.border }]} onPress={() => transfer('local')}>
              <Text style={[styles.transferText, { color: colors.foreground }]}>MOVE TO DB</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>CORE DETAILS</Text>
          <Field label="TM Number" value={form.tmNo} onChangeText={set('tmNo')} />
          <Field label="Application Name" value={form.appName} onChangeText={set('appName')} />
          <Field label="Folder / Case No" value={form.folderNo} onChangeText={set('folderNo')} />
          <ClassPicker value={form.appClass} onChange={(value) => set('appClass')(value)} />
          <DateField value={form.date} onChange={(value) => set('date')(value)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>STATUS</Text>
          <Field label="Stage" value={form.stage} onChangeText={set('stage')} />
          <Field label="Sub Stage" value={form.subStage} onChangeText={set('subStage')} />
          <Field label="City" value={form.city} onChangeText={set('city')} />
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>Duplicate</Text>
            <Text style={[styles.toggleState, { color: form.isDuplicate ? colors.primary : colors.mutedForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
              {form.isDuplicate ? 'ON' : 'OFF'}
            </Text>
            <Switch
              value={form.isDuplicate}
              onValueChange={set('isDuplicate') as any}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={form.isDuplicate ? colors.primaryForeground : colors.mutedForeground}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>TM-11 Filed</Text>
            <Text style={[styles.toggleState, { color: form.isTm11 ? colors.primary : colors.mutedForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
              {form.isTm11 ? 'ON' : 'OFF'}
            </Text>
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

        {/* Audit Log */}
        <TouchableOpacity
          style={[styles.logToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLog(v => !v); }}
          activeOpacity={0.8}
        >
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.logToggleText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            CHANGE LOG
          </Text>
          {changeLog && (
            <View style={[styles.logBadge, { backgroundColor: colors.foreground }]}>
              <Text style={[styles.logBadgeText, { color: colors.background }]}>{changeLog.length}</Text>
            </View>
          )}
          <Feather name={showLog ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {showLog && (
          <View style={[styles.logContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {logLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ margin: 16 }} />
            ) : !changeLog || changeLog.length === 0 ? (
              <Text style={[styles.logEmpty, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                No changes recorded yet.
              </Text>
            ) : (
              changeLog.map((entry, i) => {
                const isCreate = entry.field === 'CREATE';
                const changedAt = entry.changedAt
                  ? new Date(entry.changedAt).toLocaleString()
                  : '—';
                return (
                  <View
                    key={entry.id}
                    style={[styles.logEntry, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  >
                    <View style={styles.logEntryHeader}>
                      <View style={[
                        styles.logFieldBadge,
                        { backgroundColor: isCreate ? '#0A6B52' : '#C94A00' },
                      ]}>
                        <Text style={[styles.logFieldText, { fontFamily: 'SpaceGrotesk_700Bold' }]}>
                          {isCreate ? 'CREATED' : entry.field.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.logDate, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                        {changedAt}
                      </Text>
                    </View>
                    {!isCreate && (
                      <View style={styles.logDiff}>
                        <View style={[styles.logDiffBox, { backgroundColor: '#FFF0E8', borderLeftColor: '#CC0000' }]}>
                          <Text style={[styles.logDiffLabel, { color: '#CC0000', fontFamily: 'SpaceGrotesk_700Bold' }]}>BEFORE</Text>
                          <Text style={[styles.logDiffValue, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                            {entry.oldValue ?? '—'}
                          </Text>
                        </View>
                        <View style={[styles.logDiffBox, { backgroundColor: '#E8F5EE', borderLeftColor: '#0A6B52' }]}>
                          <Text style={[styles.logDiffLabel, { color: '#0A6B52', fontFamily: 'SpaceGrotesk_700Bold' }]}>AFTER</Text>
                          <Text style={[styles.logDiffValue, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                            {entry.newValue}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

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
  calendar: { borderWidth: 2, padding: 10, marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.28%', textAlign: 'center', fontSize: 10, paddingVertical: 4 },
  calendarCell: { width: '14.28%', alignItems: 'center', paddingVertical: 7 },
  calendarCellText: { fontSize: 13 },
  recordSummary: { borderWidth: 2, padding: 12, marginBottom: 14 },
  summarySource: { fontSize: 12, letterSpacing: 0.7 },
  summaryStage: { fontSize: 13, marginTop: 6 },
  transferRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  transferButton: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 8 },
  transferText: { fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
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
  toggleState: { fontSize: 11, letterSpacing: 0.8, marginLeft: 'auto', marginRight: 8 },
  logToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    padding: 12,
    marginTop: 12,
  },
  logToggleText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  logBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  logBadgeText: { fontSize: 10, fontWeight: 'bold' },
  logContainer: {
    borderWidth: 2,
    borderTopWidth: 0,
  },
  logEmpty: {
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  logEntry: {
    padding: 12,
  },
  logEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  logFieldBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logFieldText: {
    fontSize: 9,
    color: 'white',
    letterSpacing: 0.8,
  },
  logDate: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  logDiff: {
    gap: 6,
  },
  logDiffBox: {
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logDiffLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  logDiffValue: {
    fontSize: 13,
  },
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
