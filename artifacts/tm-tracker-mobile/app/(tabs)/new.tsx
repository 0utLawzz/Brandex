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
  Modal,
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
import * as ImagePicker from 'expo-image-picker';
import { ClassPicker } from '@/components/ClassPicker';

interface FormState {
  date: string;
  prefix: string;
  clientNo: string;
  caseNo: string;
  tmNo: string;
  appName: string;
  folderNo: string;
  appClass: string;
  city: string;
  stage: string;
  subStage: string;
  status: string;
  isDuplicate: boolean;
  isTm11: boolean;
  notes: string;
  imageUrl: string;
  pdfUrl: string;
}

const INITIAL: FormState = {
  date: '',
  prefix: 'X',
  clientNo: '',
  caseNo: '',
  tmNo: '',
  appName: '',
  folderNo: '',
  appClass: '',
  city: 'Islamabad',
  stage: 'STAGE 1',
  subStage: '',
  status: '',
  isDuplicate: false,
  isTm11: false,
  notes: '',
  imageUrl: '',
  pdfUrl: '',
};

const PREFIXES = ['X', 'A', 'N'];
const CITIES = ['Islamabad', 'Karachi', 'Lahore', 'Peshawar'];

const STAGE_CONFIG = {
  'STAGE 1': ['Examination', 'Acknowledgement', 'TM Number Received'],
  'STAGE 2': ['Assign Uzma (KRI)', 'Assign Faisal (LHR)', 'Assign Faisal (KRI)', 'Assign Rashid (KRI)', 'Opposition', 'Hearing'],
  'STAGE 3': ['Accepted', 'Published', 'Demand Note Issued'],
  'STAGE 4': ['Opposition', 'Certificate Received', 'Certificate Dispatch', 'Certificate Image'],
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
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>FILING DATE *</Text>
      <TouchableOpacity style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={() => setVisible(true)}>
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground }}>{value || 'SELECT DATE'}</Text>
      </TouchableOpacity>
      {visible && (
        <View style={[styles.calendar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={{ color: colors.foreground, fontSize: 20 }}>‹</Text></TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: colors.foreground }]}>{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={{ color: colors.foreground, fontSize: 20 }}>›</Text></TouchableOpacity>
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

function Toggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>{label}</Text>
      <Text style={[styles.toggleState, { color: value ? colors.primary : colors.mutedForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
        {value ? 'ON' : 'OFF'}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={value ? colors.primaryForeground : colors.mutedForeground}
      />
    </View>
  );
}

function Dropdown({ label, value, options, onSelect, required }: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  required?: boolean;
}) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        {label.toUpperCase()}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        style={[styles.input, {
          borderColor: colors.border,
          backgroundColor: colors.input,
        }]}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }}>
          {value || 'Select...'}
        </Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>Select {label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, value === option && { backgroundColor: colors.primary }]}
                onPress={() => {
                  onSelect(option);
                  setVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, { 
                  color: value === option ? colors.primaryForeground : colors.foreground,
                  fontFamily: 'SpaceGrotesk_400Regular'
                }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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

  // Auto-set date on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    set('date')(today);
  }, []);

  // Update substage options when stage changes
  const handleStageChange = (newStage: string) => {
    set('stage')(newStage);
    set('subStage')(''); // Reset substage when stage changes
  };

  // Image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      set('imageUrl')(result.assets[0].uri);
    }
  };

  // PDF picker
  const pickPdf = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      // For now, we'll use the URI. In production, this should upload to a storage service
      set('pdfUrl')(result.assets[0].uri);
    }
  };

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
    if (!form.date.trim()) {
      Alert.alert('Required', 'Date is required.');
      return;
    }
    if (!form.clientNo.trim()) {
      Alert.alert('Required', 'Client Number is required.');
      return;
    }
    if (!form.caseNo.trim()) {
      Alert.alert('Required', 'Case Number is required.');
      return;
    }
    if (!form.appName.trim()) {
      Alert.alert('Required', 'Application Name is required.');
      return;
    }
    if (!form.city.trim()) {
      Alert.alert('Required', 'City is required.');
      return;
    }
    if (!form.stage.trim()) {
      Alert.alert('Required', 'Stage is required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createMutation.mutate({
      data: {
        date: form.date.trim(),
        prefix: form.prefix,
        clientNo: form.clientNo.trim(),
        caseNo: form.caseNo.trim(),
        tmNo: form.tmNo.trim() || null,
        appName: form.appName.trim(),
        folderNo: form.folderNo.trim() || null,
        appClass: form.appClass.trim() || null,
        city: form.city.trim(),
        stage: form.stage.trim(),
        subStage: form.subStage.trim() || null,
        status: form.subStage.trim() || form.stage.trim(),
        notes: form.notes.trim() || null,
        isDuplicate: form.isDuplicate,
        isTm11: form.isTm11,
        imageUrl: form.imageUrl.trim() || null,
        pdfUrl: form.pdfUrl.trim() || null,
      },
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
        <DateField value={form.date} onChange={(value) => set('date')(value)} />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Dropdown label="Prefix" value={form.prefix} options={PREFIXES} onSelect={set('prefix')} required />
          </View>
          <View style={styles.halfField}>
            <Field label="Client No" value={form.clientNo} onChangeText={set('clientNo')} required placeholder="284" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Field label="Case No" value={form.caseNo} onChangeText={set('caseNo')} required placeholder="001" />
          </View>
          <View style={styles.halfField}>
            <Field label="TM Number" value={form.tmNo} onChangeText={set('tmNo')} placeholder="12345678" />
          </View>
        </View>
        <Field label="Application Name" value={form.appName} onChangeText={set('appName')} required placeholder="Brand / mark name" />
        <Field label="Folder No" value={form.folderNo} onChangeText={set('folderNo')} placeholder="e.g. A-2024-001" />
        <ClassPicker value={form.appClass} onChange={(value) => set('appClass')(value)} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>STATUS</Text>
        <Dropdown label="City" value={form.city} options={CITIES} onSelect={set('city')} required />
        <Dropdown label="Stage" value={form.stage} options={Object.keys(STAGE_CONFIG)} onSelect={handleStageChange} required />
        <Dropdown label="Sub Stage" value={form.subStage} options={STAGE_CONFIG[form.stage as keyof typeof STAGE_CONFIG] || []} onSelect={set('subStage')} />
        <Toggle label="Duplicate" value={form.isDuplicate} onValueChange={set('isDuplicate') as any} />
        <Toggle label="TM-11 Filed" value={form.isTm11} onValueChange={set('isTm11') as any} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={[styles.section, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>ATTACHMENTS</Text>
        <View style={styles.attachmentRow}>
          <TouchableOpacity style={[styles.attachmentBtn, { borderColor: colors.border, flex: 1 }]} onPress={pickImage}>
            <Text style={[styles.attachmentText, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
              {form.imageUrl ? 'Change Image' : 'Add Image'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.attachmentBtn, { borderColor: colors.border, flex: 1 }]} onPress={pickPdf}>
            <Text style={[styles.attachmentText, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
              {form.pdfUrl ? 'Change PDF' : 'Add PDF'}
            </Text>
          </TouchableOpacity>
        </View>
        {form.imageUrl && (
          <Text style={[styles.attachmentStatus, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            ✓ Image selected
          </Text>
        )}
        {form.pdfUrl && (
          <Text style={[styles.attachmentStatus, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            ✓ PDF selected
          </Text>
        )}
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
  },
  inputText: {
    fontSize: 15,
  },
  calendar: { borderWidth: 2, padding: 10, marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.28%', textAlign: 'center', fontSize: 10, paddingVertical: 4 },
  calendarCell: { width: '14.28%', alignItems: 'center', paddingVertical: 7 },
  calendarCellText: { fontSize: 13 },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  halfField: { flex: 1 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderWidth: 2,
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  modalOption: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 4,
  },
  modalOptionText: {
    fontSize: 16,
  },
  attachmentBtn: {
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  attachmentStatus: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
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
