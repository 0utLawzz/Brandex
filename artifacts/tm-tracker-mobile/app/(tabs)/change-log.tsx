import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

interface ChangeLogItem {
  id: number;
  trademarkId: number;
  field: string;
  oldValue: string | null;
  newValue: string;
  changedAt: string | null;
  changedBy: string;
  appName?: string | null;
  tmNo?: string | null;
  folderNo?: string | null;
}

function useChangeLog(limit = 100) {
  return useQuery<ChangeLogItem[]>({
    queryKey: ['change-log', limit],
    queryFn: async () => {
      const { customFetch } = await import('@workspace/api-client-react');
      return customFetch<ChangeLogItem[]>(`/api/change-log?limit=${limit}`);
    },
    staleTime: 15_000,
  });
}

function FieldBadge({ field }: { field: string }) {
  const colors = useColors();
  const isCreate = field === 'CREATE';
  return (
    <View style={[
      styles.fieldBadge,
      { backgroundColor: isCreate ? colors.secondary : colors.accent, borderColor: colors.border },
    ]}>
      <Text style={[styles.fieldBadgeText, {
        color: isCreate ? colors.secondaryForeground : colors.accentForeground,
        fontFamily: 'SpaceGrotesk_700Bold',
      }]}>
        {field.toUpperCase()}
      </Text>
    </View>
  );
}

export default function ChangeLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: logs, isLoading, isError, refetch, isRefetching } = useChangeLog();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const renderItem = ({ item }: { item: ChangeLogItem }) => {
    const trademarkLabel = item.appName || item.tmNo || item.folderNo || `TM #${item.trademarkId}`;
    return (
      <View style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logHeader}>
          <FieldBadge field={item.field} />
          <Text style={[styles.logDate, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            {item.changedAt ? new Date(item.changedAt).toLocaleString() : '—'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/trademark/${item.trademarkId}`)}
          style={styles.tmLabel}
        >
          <Feather name="link" size={11} color={colors.primary} />
          <Text style={[styles.tmLabelText, { color: colors.primary, fontFamily: 'SpaceGrotesk_600SemiBold' }]} numberOfLines={1}>
            {trademarkLabel}
          </Text>
        </TouchableOpacity>

        {item.oldValue != null && (
          <View style={styles.changeRow}>
            <View style={[styles.changeTag, { backgroundColor: '#CC000022', borderColor: '#CC0000' }]}>
              <Text style={[styles.changeTagText, { color: '#CC0000' }]}>OLD</Text>
            </View>
            <Text style={[styles.changeValue, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={2}>
              {item.oldValue}
            </Text>
          </View>
        )}

        <View style={styles.changeRow}>
          <View style={[styles.changeTag, { backgroundColor: '#0A6B5222', borderColor: '#0A6B52' }]}>
            <Text style={[styles.changeTagText, { color: '#0A6B52' }]}>NEW</Text>
          </View>
          <Text style={[styles.changeValue, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={2}>
            {item.newValue}
          </Text>
        </View>

        <Text style={[styles.changedBy, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
          By: {item.changedBy}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          CHANGE LOG
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
          {logs ? `${logs.length} recent changes` : 'Track all modifications to trademark records'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Loading changes...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
            Failed to load changes
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.border, backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
              RETRY
            </Text>
          </TouchableOpacity>
        </View>
      ) : !logs || logs.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="clock" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
            No Changes Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Changes to trademark records will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === 'web' ? 34 : 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
  title: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logItem: {
    borderWidth: 2,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fieldBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  logDate: {
    fontSize: 11,
  },
  tmLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  tmLabelText: {
    fontSize: 13,
    flex: 1,
  },
  changeRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
    gap: 8,
  },
  changeTag: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  changeTagText: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 0.5,
  },
  changeValue: {
    fontSize: 12,
    flex: 1,
  },
  changedBy: {
    fontSize: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 6,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
