import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Ticket } from '@/types';
import { isTicketExpired } from '@/contexts/TicketsContext';
import { StatusBadge } from './StatusBadge';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  onDelete: () => void;
}

export function TicketCard({ ticket, onPress, onDelete }: TicketCardProps) {
  const colors = useColors();
  const expired = isTicketExpired(ticket);

  const createdDate = new Date(ticket.createdAt).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const expiresDate = new Date(ticket.expiresAt).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: expired ? colors.border : colors.primary + '33',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.credentialsRow}>
          <Text style={[styles.username, { color: colors.foreground }]}>
            {ticket.username}
          </Text>
          <Text style={[styles.separator, { color: colors.mutedForeground }]}> / </Text>
          <Text style={[styles.password, { color: colors.primary }]}>
            {ticket.password}
          </Text>
        </View>
        <View style={styles.actions}>
          <StatusBadge expired={expired} />
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Plan</Text>
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {ticket.planName} · {ticket.durationLabel}
          </Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Precio</Text>
          <Text style={[styles.infoValue, { color: colors.primary }]}>
            ${ticket.price.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
            {createdDate}
          </Text>
        </View>
        <View style={styles.timeItem}>
          <Feather name="alert-circle" size={11} color={expired ? colors.destructive : colors.mutedForeground} />
          <Text
            style={[
              styles.timeText,
              { color: expired ? colors.destructive : colors.mutedForeground },
            ]}
          >
            {expiresDate}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  separator: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  password: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    height: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 24,
  },
  infoBlock: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
