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
  const stageColor = item.stage ? (STAGE_COLORS[item.stage] ?? colors.mutedForeground) : colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.tmNo, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]} numberOfLines={1}>
          {item.tmNo ?? '—'}
        </Text>
        <View style={styles.badges}>
          {item.isTm11 && (
            <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.accentForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>TM-11</Text>
            </View>
          )}
          {item.isDuplicate && (
            <View style={[styles.badge, { backgroundColor: colors.destructive, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.destructiveForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>DUP</Text>
            </View>
          )}
          {item.source === 'sheets' && (
            <Feather name="grid" size={12} color={colors.mutedForeground} />
          )}
        </View>
      </View>

      <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]} numberOfLines={1}>
        {item.appName ?? '—'}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.stagePill, { borderColor: stageColor }]}>
          <Text style={[styles.stageText, { color: stageColor, fontFamily: 'SpaceGrotesk_500Medium' }]}>
            {item.stage ?? 'No Stage'}
          </Text>
        </View>
        {item.city ? (
          <Text style={[styles.city, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            {item.city}
          </Text>
        ) : null}
        {item.folderNo ? (
          <Text style={[styles.folder, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            #{item.folderNo}
          </Text>
        ) : null}
      </View>
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
  appName: {
    fontSize: 16,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  stagePill: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stageText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  city: {
    fontSize: 12,
  },
  folder: {
    fontSize: 12,
  },
});
