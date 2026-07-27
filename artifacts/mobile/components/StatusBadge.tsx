import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatusBadgeProps {
  expired: boolean;
}

export function StatusBadge({ expired }: StatusBadgeProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: expired ? colors.destructive + '22' : colors.success + '22' },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: expired ? colors.destructive : colors.success },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: expired ? colors.destructive : colors.success },
        ]}
      >
        {expired ? 'Vencido' : 'Activo'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
