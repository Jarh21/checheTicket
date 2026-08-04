import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Ticket } from '@/types';
import { printTicket, shareTicket } from '@/services/printer';
import { printTicketBluetooth } from '@/services/bluetooth-printer';
import { usePrinter } from '@/contexts/PrinterContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

interface GeneratedTicketModalProps {
  ticket: Ticket | null;
  visible: boolean;
  wifiName: string;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GeneratedTicketModal({
  ticket,
  visible,
  wifiName,
  onClose,
}: GeneratedTicketModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [printing, setPrinting] = useState(false);
  const [bluetoothPrinting, setBluetoothPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { selectedPrinter } = usePrinter();

  if (!ticket) return null;

  async function handlePrint() {
    if (!ticket) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrinting(true);
    await printTicket(ticket, wifiName);
    setPrinting(false);
  }

  async function handleShare() {
    if (!ticket) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);
    await shareTicket(ticket, wifiName);
    setSharing(false);
  }

  async function handleBluetoothPrint() {
    if (!ticket || !selectedPrinter) {
      Alert.alert('Sin impresora', 'Selecciona una impresora Bluetooth en Ajustes.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBluetoothPrinting(true);
    const result = await printTicketBluetooth(ticket, wifiName, selectedPrinter);
    setBluetoothPrinting(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Ticket impreso', `Enviado a ${selectedPrinter.name || selectedPrinter.id}.`);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No se pudo imprimir', result.error || 'Verifica la conexión Bluetooth.');
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Ticket Generado
              </Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {ticket.planName} · {ticket.durationLabel}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Receipt card */}
            <View style={[styles.receipt, { backgroundColor: '#FFFFFF' }]}>
              <Text style={styles.receiptHeader}>INTERNET HOTSPOT</Text>
              <View style={styles.receiptDivider} />

              {/* Credentials - big & readable */}
              <View style={styles.credBlock}>
                <Text style={styles.credLabel}>USUARIO</Text>
                <Text style={styles.credValue}>{ticket.username}</Text>
              </View>
              <View style={[styles.credBlock, { marginTop: 8 }]}>
                <Text style={styles.credLabel}>CONTRASEÑA</Text>
                <Text style={styles.credValue}>{ticket.password}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Plan</Text>
                <Text style={styles.receiptRowValue}>{ticket.planName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Duración</Text>
                <Text style={styles.receiptRowValue}>{ticket.durationLabel}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Precio</Text>
                <Text style={[styles.receiptRowValue, { fontWeight: '700' }]}>
                  ${ticket.price.toFixed(2)}
                </Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Inicio</Text>
                <Text style={styles.receiptRowValue}>{formatDate(ticket.createdAt)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Expira</Text>
                <Text style={styles.receiptRowValue}>{formatDate(ticket.expiresAt)}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <Text style={styles.receiptWifi}>Red WiFi: {wifiName}</Text>
              <View style={styles.receiptDivider} />
              <Text style={styles.receiptFooter}>Gracias por su preferencia</Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <Pressable
                onPress={handleBluetoothPrint}
                disabled={bluetoothPrinting}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed || bluetoothPrinting ? 0.8 : 1,
                  },
                ]}
              >
                {bluetoothPrinting ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <MaterialCommunityIcons name="bluetooth" size={20} color={colors.primary} />
                )}
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  {bluetoothPrinting ? 'Enviando...' : 'Bluetooth'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePrint}
                disabled={printing}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {printing ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <MaterialCommunityIcons name="printer" size={20} color={colors.primaryForeground} />
                )}
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  {printing ? 'Imprimiendo...' : 'Imprimir'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.secondary,
                    opacity: pressed ? 0.8 : 1,
                    flex: 0.6,
                  },
                ]}
              >
                {sharing ? (
                  <ActivityIndicator color={colors.foreground} size="small" />
                ) : (
                  <Feather name="share-2" size={18} color={colors.foreground} />
                )}
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
                  {sharing ? 'Compartiendo...' : 'Compartir'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  receipt: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  receiptHeader: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 2,
    marginBottom: 10,
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    marginVertical: 8,
  },
  credBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  credLabel: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.5,
  },
  credValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#000',
    letterSpacing: 3,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receiptRowLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  receiptRowValue: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Inter_600SemiBold',
  },
  receiptWifi: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  receiptFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#888',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
