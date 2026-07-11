import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  title: string;
  value: number | string;
  backgroundColor: string;
  textColor?: string;
}

export function StatCard({ title, value, backgroundColor, textColor }: StatCardProps) {
  const colors = useColors();
  const fg = textColor ?? colors.foreground;

  return (
    <View style={[styles.card, { backgroundColor, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: fg, fontFamily: 'SpaceGrotesk_700Bold' }]}>
        {value}
      </Text>
      <Text style={[styles.title, { color: fg, fontFamily: 'SpaceGrotesk_500Medium' }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    minHeight: 90,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 36,
    lineHeight: 40,
  },
  title: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
