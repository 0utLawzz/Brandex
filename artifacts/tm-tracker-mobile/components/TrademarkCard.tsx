import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import type { Trademark } from '@workspace/api-client-react';

interface TrademarkCardProps {
  item: Trademark;
  onPress: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  'Filed': '#0A6B52',
  'Registered': '#0A6B52',
  'Pending': '#D4A800',
  'Abandoned': '#CC0000',
  'Rejected': '#CC0000',
  'Opposed': '#C94A00',
};

export function TrademarkCard({ item, onPress }: TrademarkCardProps) {
  const colors = useColors();
  const stageColor = item.stage ? (STAGE_COLORS[item.stage] ?? colors.primary) : colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.tmNo, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]} numberOfLines={1}>
          ADD TM#: {item.tmNo ?? '—'}
        </Text>
        <View style={styles.badges}>
          <View style={styles.lightItem}><View style={[styles.light, { backgroundColor: item.isDuplicate ? '#18A558' : '#777' }]} /><Text style={[styles.lightText, { color: colors.mutedForeground }]}>DUP</Text></View>
          <View style={styles.lightItem}><View style={[styles.light, { backgroundColor: item.isTm11 ? '#18A558' : '#777' }]} /><Text style={[styles.lightText, { color: colors.mutedForeground }]}>TM-11</Text></View>
          <View style={[
            styles.sourceBadge,
            {
              backgroundColor: item.source === 'sheets' ? colors.accent : colors.input,
              borderColor: colors.border,
            },
          ]}>
            <Text style={[
              styles.sourceBadgeText,
              {
                color: item.source === 'sheets' ? colors.accentForeground : colors.mutedForeground,
                fontFamily: 'SpaceGrotesk_700Bold',
              },
            ]}>
              {item.source === 'sheets' ? 'SHEET' : 'DB'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]} numberOfLines={1}>
        {item.appName ?? '—'}
      </Text>

      <View style={[styles.stageRow, { backgroundColor: stageColor }]}>
          <Text style={[styles.stageText, { color: '#FFF7E6', fontFamily: 'SpaceGrotesk_700Bold' }]}>
            {item.stage ?? 'No Stage'}
          </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>DATE: {item.date || '—'}</Text>
        <Text style={[styles.folder, { color: colors.mutedForeground }]}>FOLDER / CASE NO: {item.folderNo || '—'}</Text>
      </View>
      <Text style={[styles.subStage, { color: colors.mutedForeground }]}>SUB STAGE: {item.subStage || '—'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tmNo: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  sourceBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceBadgeText: {
    fontSize: 8,
    letterSpacing: 0.4,
  },
  appName: {
    fontSize: 16,
    marginBottom: 10,
  },
  stageRow: { paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  stageText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  metaRow: { gap: 4 },
  date: { fontSize: 11 },
  folder: { fontSize: 11 },
  subStage: { fontSize: 11, marginTop: 4 },
  lightItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  light: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#222' },
  lightText: { fontSize: 8, fontFamily: 'SpaceGrotesk_700Bold' },
});
