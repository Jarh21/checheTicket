import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  onPress: () => void;
  disabled?: boolean;
}

export function PlanCard({ plan, onPress, disabled }: PlanCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed || disabled ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: colors.primary + '22' }]}
      >
        <MaterialCommunityIcons
          name={plan.type === 'hours' ? 'clock-outline' : 'calendar-outline'}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
        {plan.name}
      </Text>

      <Text style={[styles.duration, { color: colors.mutedForeground }]}>
        {plan.type === 'hours'
          ? `${plan.duration}h`
          : `${plan.duration}d`}
        {' · '}
        {plan.downloadSpeed}/{plan.uploadSpeed} Mbps
      </Text>

      <Text style={[styles.price, { color: colors.primary }]}>
        ${plan.price.toFixed(2)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    minHeight: 130,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
});
