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
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlans } from '@/contexts/PlansContext';
import { useTickets } from '@/contexts/TicketsContext';
import { useConfig } from '@/contexts/ConfigContext';
import { getPlanProfileName, Plan } from '@/types';
import { PlanCard } from '@/components/PlanCard';
import { GeneratedTicketModal } from '@/components/GeneratedTicketModal';
import { useQuery } from '@tanstack/react-query';
import { testConnection } from '@/services/mikrotik';
import {
  createHotspotUser,
  formatLimitUptime,
  formatRateLimit,
  generateUsername,
  generateTicketPassword,
  makeDurationLabel,
} from '@/services/mikrotik';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket } from '@/types';
import { router } from 'expo-router';
import { isTicketExpired } from '@/contexts/TicketsContext';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plans, isLoading: plansLoading } = usePlans();
  const { tickets, addTicket } = useTickets();
  const { config, isConfigured } = useConfig();

  const [generating, setGenerating] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  const { data: connStatus, isLoading: connLoading, refetch: recheckConn } = useQuery({
    queryKey: ['mikrotik-status', config.ip, config.user, config.password],
    queryFn: () => testConnection(config),
    enabled: isConfigured,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const todayTickets = tickets.filter((t) => {
    const today = new Date();
    const created = new Date(t.createdAt);
    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  });

  const activeTickets = tickets.filter((t) => !isTicketExpired(t));

  async function handlePlanPress(plan: Plan) {
    if (!isConfigured) {
      Alert.alert(
        'Sin configuración',
        'Configura las credenciales del MikroTik en Ajustes para continuar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Ajustes', onPress: () => router.navigate('/(tabs)/settings') },
        ],
      );
      return;
    }

    // Validate plan has been synced to MikroTik
    if (plan.synced === false) {
      Alert.alert(
        'Plan no sincronizado',
        'Este plan aún no ha sido creado en el router MikroTik. Ve a Planes y sincronízalo primero.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Planes', onPress: () => router.navigate('/(tabs)/plans') },
        ],
      );
      return;
    }

    if (connStatus && !connStatus.success) {
      Alert.alert(
        'Router desconectado',
        'No hay conexión con el MikroTik. Verifica la red y los ajustes.',
        [{ text: 'OK' }],
      );
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      const username = generateUsername();
      const password = generateTicketPassword();
      const limitUptime = formatLimitUptime(plan.type, plan.duration);
      const rateLimit = formatRateLimit(plan.uploadSpeed, plan.downloadSpeed);

      const result = await createHotspotUser(config, {
        username,
        password,
        limitUptime,
        rateLimit,
        profileName: plan.mikrotikProfile || getPlanProfileName(plan.id),
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo crear el usuario en MikroTik');
        return;
      }

      const createdAt = new Date();
      const expiresAt = new Date(createdAt);
      if (plan.type === 'hours') {
        expiresAt.setHours(expiresAt.getHours() + plan.duration);
      } else {
        expiresAt.setDate(expiresAt.getDate() + plan.duration);
      }

      const ticket = await addTicket({
        username,
        password,
        planId: plan.id,
        planName: plan.name,
        durationLabel: makeDurationLabel(plan.type, plan.duration),
        price: plan.price,
        limitUptime,
        rateLimit,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        mikrotikUserId: result.userId ?? '',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGeneratedTicket(ticket);
      setTicketModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setGenerating(false);
    }
  }

  const connected = connStatus?.success ?? false;
  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Panel</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Generar tickets de acceso
          </Text>
        </View>
        <Pressable
          onPress={() => recheckConn()}
          style={({ pressed }) => [
            styles.connBadge,
            {
              backgroundColor: isConfigured
                ? (connected ? colors.success + '22' : colors.destructive + '22')
                : colors.muted,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {connLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <View
                style={[
                  styles.connDot,
                  {
                    backgroundColor: isConfigured
                      ? (connected ? colors.success : colors.destructive)
                      : colors.mutedForeground,
                  },
                ]}
              />
              <Text
                style={[
                  styles.connText,
                  {
                    color: isConfigured
                      ? (connected ? colors.success : colors.destructive)
                      : colors.mutedForeground,
                  },
                ]}
              >
                {!isConfigured ? 'Sin config' : connected ? 'Conectado' : 'Desconectado'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="ticket-outline" size={20} color={colors.primary} />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{todayTickets.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Hoy</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="wifi" size={20} color={colors.success} />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{activeTickets.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Activos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="ticket-account" size={20} color={colors.warning} />
          <Text style={[styles.statNum, { color: colors.foreground }]}>{tickets.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
        </View>
      </View>

      {/* Plans section */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seleccionar Plan</Text>

      {!isConfigured && (
        <Pressable
          onPress={() => router.navigate('/(tabs)/settings')}
          style={[styles.warningBanner, { backgroundColor: colors.warning + '22', borderColor: colors.warning + '55' }]}
        >
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Configura el MikroTik en Ajustes para generar tickets
          </Text>
        </Pressable>
      )}

      {plansLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="list-box-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin planes</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Agrega planes en la pestaña Planes
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.planRow}
          contentContainerStyle={styles.planList}
          scrollEnabled={plans.length > 4}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onPress={() => handlePlanPress(item)}
              disabled={generating}
            />
          )}
        />
      )}

      {/* Loading overlay */}
      {generating && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              Creando usuario...
            </Text>
          </View>
        </View>
      )}

      {/* Ticket modal */}
      <GeneratedTicketModal
        ticket={generatedTicket}
        visible={ticketModalVisible}
        wifiName={config.wifiName}
        onClose={() => setTicketModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  planRow: {
    gap: 10,
    marginBottom: 10,
  },
  planList: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});
