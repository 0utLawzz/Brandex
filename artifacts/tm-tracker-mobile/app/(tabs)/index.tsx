import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StatCard } from '@/components/StatCard';
import { Feather } from '@expo/vector-icons';
import {
  useGetTrademarkStats,
  useSyncFromSheets,
  getGetTrademarkStatsQueryKey,
  getListTrademarksQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: stats, isLoading, refetch, isRefetching } = useGetTrademarkStats();
  const syncMutation = useSyncFromSheets({
    mutation: {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getGetTrademarkStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTrademarksQueryKey() });
        setSyncMessage(`Synced ${data.synced} records`);
        setTimeout(() => setSyncMessage(null), 3000);
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);

  const handleSync = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    syncMutation.mutate();
  }, [syncMutation]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const numericStages = ['STAGE 1', 'STAGE 2', 'STAGE 3', 'STAGE 4'].map((stage) => {
    const found = stats?.byNumericStage?.find((s) => s.stage === stage);
    return { stage, count: found?.count ?? 0 };
  });

  const assignedTotal = (stats?.byAssignedSubStage ?? []).reduce((sum, s) => sum + s.count, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === 'web' ? 34 : 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            BRANDEX LAW
          </Text>
          <Text style={[styles.appTitle, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold', marginTop: -4 }]}>
            ASSOICATE
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Trademark Registry Dashboard
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.syncButton,
            {
              backgroundColor: syncMutation.isPending ? colors.muted : colors.primary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleSync}
          disabled={syncMutation.isPending}
          activeOpacity={0.85}
        >
          {syncMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather name="refresh-cw" size={14} color={colors.primaryForeground} />
          )}
          <Text style={[styles.syncText, { color: colors.primaryForeground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
            {syncMutation.isPending ? 'SYNCING' : 'SYNC'}
          </Text>
        </TouchableOpacity>
      </View>

      {syncMessage && (
        <View style={[styles.syncBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.syncBannerText, { color: colors.secondaryForeground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
            {syncMessage}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        OVERVIEW STATS
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stat cards */}
          <View style={styles.statsRow}>
            <StatCard
              title="Total TMs"
              value={stats?.total ?? 0}
              backgroundColor={colors.secondary}
              textColor={colors.secondaryForeground}
            />
            <StatCard
              title="TM-11 Filed"
              value={stats?.tm11Count ?? 0}
              backgroundColor={colors.accent}
              textColor={colors.accentForeground}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 10 }]}>
            <StatCard
              title="Duplicates"
              value={stats?.duplicates ?? 0}
              backgroundColor={colors.primary}
              textColor={colors.primaryForeground}
            />
            <StatCard
              title="Assigned"
              value={assignedTotal}
              backgroundColor={colors.secondary}
              textColor={colors.secondaryForeground}
            />
          </View>

          {/* Stage 1-4 + Assigned */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 24 }]}>
            STAGE 1 — 4 & ASSIGNED
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stageGrid}>
              {numericStages.map((s) => (
                <View key={s.stage} style={[styles.stageMini, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.stageMiniValue, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                    {s.count}
                  </Text>
                  <Text style={[styles.stageMiniLabel, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
                    {s.stage}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }]}>
            <Text style={[styles.boxTitle, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium' }]}>
              ASSIGNED BY SUB-STATUS
            </Text>
            {(stats?.byAssignedSubStage ?? []).length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                No assigned records
              </Text>
            ) : (
              (stats?.byAssignedSubStage ?? []).sort((a, b) => b.count - a.count).map((s) => (
                <View key={s.subStage} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
                    {s.subStage || 'UNASSIGNED'}
                  </Text>
                  <Text style={[styles.breakdownCount, { color: colors.secondary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                    {s.count}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* City breakdown */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 24 }]}>
            CITY BREAKDOWN
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(stats?.byCity ?? []).length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                No city data
              </Text>
            ) : (
              (stats?.byCity ?? []).sort((a, b) => b.count - a.count).map((c) => (
                <View key={c.city} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
                    {c.city || 'UNASSIGNED'}
                  </Text>
                  <Text style={[styles.breakdownCount, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                    {c.count}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Stage distribution */}
          {(stats?.byStage ?? []).length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 24 }]}>
                STAGE DISTRIBUTION
              </Text>
              <View style={[styles.stageContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {(stats?.byStage ?? [])
                  .sort((a, b) => b.count - a.count)
                  .map((s, i) => {
                    const pct = stats?.total ? (s.count / stats.total) * 100 : 0;
                    return (
                      <View key={s.stage} style={[styles.stageRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={[styles.stageName, { color: colors.foreground, fontFamily: 'SpaceGrotesk_500Medium' }]} numberOfLines={1}>
                          {s.stage}
                        </Text>
                        <View style={styles.stageBarWrap}>
                          <View
                            style={[
                              styles.stageBar,
                              { width: `${pct}%` as any, backgroundColor: colors.primary },
                            ]}
                          />
                        </View>
                        <Text style={[styles.stageCount, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                          {s.count}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  syncText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  syncBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    padding: 10,
  },
  syncBannerText: {
    fontSize: 13,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 2,
    padding: 14,
    marginHorizontal: 16,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  boxTitle: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageMini: {
    flex: 1,
    minWidth: '22%',
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
  },
  stageMiniValue: {
    fontSize: 28,
    lineHeight: 32,
  },
  stageMiniLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  breakdownLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  breakdownCount: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  stageContainer: {
    marginHorizontal: 16,
    borderWidth: 2,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  stageName: { fontSize: 13, width: 100 },
  stageBarWrap: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  stageBar: { height: 8 },
  stageCount: { fontSize: 14, width: 28, textAlign: 'right' },
});
