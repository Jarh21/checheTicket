import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useTickets, isTicketExpired } from '@/contexts/TicketsContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Ticket } from '@/types';
import { TicketCard } from '@/components/TicketCard';
import { GeneratedTicketModal } from '@/components/GeneratedTicketModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Filter = 'all' | 'active' | 'expired';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tickets, isLoading, deleteTicket, cleanExpired } = useTickets();
  const { config } = useConfig();

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = tickets.filter((t) => {
    if (filter === 'active') return !isTicketExpired(t);
    if (filter === 'expired') return isTicketExpired(t);
    return true;
  });

  const expiredCount = tickets.filter(isTicketExpired).length;

  function handleViewTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setModalVisible(true);
  }

  function handleDeleteTicket(ticket: Ticket) {
    Alert.alert('Eliminar Ticket', `¿Eliminar el ticket de "${ticket.username}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteTicket(ticket.id);
        },
      },
    ]);
  }

  async function handleCleanExpired() {
    if (expiredCount === 0) {
      Alert.alert('Sin vencidos', 'No hay tickets vencidos para limpiar.');
      return;
    }
    Alert.alert(
      'Limpiar Vencidos',
      `¿Eliminar ${expiredCount} ticket${expiredCount !== 1 ? 's' : ''} vencido${expiredCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const removed = await cleanExpired();
            Alert.alert('Listo', `Se eliminaron ${removed} ticket${removed !== 1 ? 's' : ''} vencido${removed !== 1 ? 's' : ''}.`);
          },
        },
      ],
    );
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'expired', label: 'Vencidos' },
  ];

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Historial</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrado{tickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {expiredCount > 0 && (
          <Pressable
            onPress={handleCleanExpired}
            style={({ pressed }) => [
              styles.cleanBtn,
              { borderColor: colors.destructive + '66', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
            <Text style={[styles.cleanBtnText, { color: colors.destructive }]}>
              Limpiar ({expiredCount})
            </Text>
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.muted }]}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              filter === f.key && { backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === f.key ? colors.foreground : colors.mutedForeground,
                  fontFamily: filter === f.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="ticket-outline"
            size={56}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === 'all'
              ? 'Sin tickets'
              : filter === 'active'
                ? 'Sin tickets activos'
                : 'Sin tickets vencidos'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {filter === 'all'
              ? 'Los tickets generados aparecerán aquí'
              : 'Cambia el filtro para ver otros tickets'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => handleViewTicket(item)}
              onDelete={() => handleDeleteTicket(item)}
            />
          )}
        />
      )}

      <GeneratedTicketModal
        ticket={selectedTicket}
        visible={modalVisible}
        wifiName={config.wifiName}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cleanBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  filterRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterText: { fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: 24 },
});
