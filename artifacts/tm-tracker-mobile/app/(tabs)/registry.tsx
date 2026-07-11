import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { TrademarkCard } from '@/components/TrademarkCard';
import { Feather } from '@expo/vector-icons';
import { useListTrademarks } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const STAGE_FILTERS = ['All', 'Filed', 'Pending', 'Registered', 'Rejected', 'Opposed', 'Abandoned'];

export default function RegistryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState('All');

  const { data: trademarks, isLoading, refetch, isRefetching } = useListTrademarks(
    {
      search: search.trim() || undefined,
      stage: activeStage !== 'All' ? activeStage : undefined,
    },
    {
      query: {
        staleTime: 10_000,
      },
    }
  );

  const handlePress = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/trademark/${id}`);
  }, [router]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search header */}
      <View style={[styles.searchArea, { paddingTop: topPad + 12 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]}
            placeholder="Search TM No, name, folder…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stage filter pills */}
      <FlatList
        horizontal
        data={STAGE_FILTERS}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={[styles.filterRow, { borderBottomColor: colors.border }]}
        renderItem={({ item }) => {
          const active = item === activeStage;
          return (
            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary : 'transparent',
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveStage(item);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: 'SpaceGrotesk_600SemiBold',
                  },
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Trademark list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={trademarks ?? []}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === 'web' ? 34 : 100 },
          ]}
          scrollEnabled={!!(trademarks && trademarks.length > 0)}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
                No trademarks found
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                {search || activeStage !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first trademark or sync from Google Sheets'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TrademarkCard item={item} onPress={() => handlePress(item.id)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchArea: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    borderBottomWidth: 2,
    maxHeight: 44,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
