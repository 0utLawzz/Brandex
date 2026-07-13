import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
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

export default function SearchTmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tmNo, setTmNo] = useState('');

  const { data: trademarks, isLoading, refetch } = useListTrademarks(
    {
      search: tmNo.trim() || undefined,
    },
    {
      query: {
        enabled: tmNo.trim().length > 0,
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
      <View style={[styles.searchArea, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          SEARCH BY TM NO
        </Text>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="hash" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: 'SpaceGrotesk_400Regular' }]}
            placeholder="Enter trademark number…"
            placeholderTextColor={colors.mutedForeground}
            value={tmNo}
            onChangeText={setTmNo}
            returnKeyType="search"
            autoFocus
          />
          {tmNo.length > 0 && (
            <TouchableOpacity onPress={() => setTmNo('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
                {tmNo.trim() ? 'No trademarks found' : 'Type a TM number to search'}
              </Text>
              {tmNo.trim() ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                  Try a different trademark number
                </Text>
              ) : null}
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
  screenTitle: {
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: 12,
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
