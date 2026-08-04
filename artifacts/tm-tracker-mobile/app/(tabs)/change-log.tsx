import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ChangeLogItem {
  id: number;
  trademarkId: number;
  field: string;
  oldValue: string | null;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

// Mock data for now - will be replaced with API call
const MOCK_CHANGE_LOGS: ChangeLogItem[] = [];

export default function ChangeLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedTrademarkId, setSelectedTrademarkId] = useState<number | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filteredLogs = selectedTrademarkId
    ? MOCK_CHANGE_LOGS.filter((log) => log.trademarkId === selectedTrademarkId)
    : MOCK_CHANGE_LOGS;

  const renderItem = ({ item }: { item: ChangeLogItem }) => (
    <View style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logField, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          {item.field}
        </Text>
        <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
          {new Date(item.changedAt).toLocaleString()}
        </Text>
      </View>
      {item.oldValue && (
        <View style={styles.changeRow}>
          <Text style={[styles.changeLabel, { color: colors.mutedForeground }]}>OLD:</Text>
          <Text style={[styles.changeValue, { color: colors.foreground }]}>{item.oldValue}</Text>
        </View>
      )}
      <View style={styles.changeRow}>
        <Text style={[styles.changeLabel, { color: colors.mutedForeground }]}>NEW:</Text>
        <Text style={[styles.changeValue, { color: colors.foreground }]}>{item.newValue}</Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push(`/trademark/${item.trademarkId}`)}
        style={styles.viewTrademarkBtn}
      >
        <Text style={[styles.viewTrademarkText, { color: colors.primary }]}>
          View TM #{item.trademarkId}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          CHANGE LOG
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
          Track all modifications to trademark records
        </Text>
      </View>

      {MOCK_CHANGE_LOGS.length === 0 ? (
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
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === 'web' ? 34 : 100 },
          ]}
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
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logItem: {
    borderWidth: 2,
    padding: 14,
    marginBottom: 12,
    borderRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logField: {
    fontSize: 14,
  },
  logDate: {
    fontSize: 11,
  },
  changeRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  changeLabel: {
    fontSize: 11,
    width: 40,
    flexShrink: 0,
  },
  changeValue: {
    fontSize: 12,
    flex: 1,
  },
  viewTrademarkBtn: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  viewTrademarkText: {
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
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
});
