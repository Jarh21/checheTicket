import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePrinter } from '@/contexts/PrinterContext';
import { MikroTikConfig } from '@/types';
import { testConnection } from '@/services/mikrotik';
import {
  getPairedBluetoothPrinters,
  isBluetoothPrinterAvailable,
  BluetoothPrinter,
} from '@/services/bluetooth-printer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

function SettingInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShow(!show)} hitSlop={10}>
            <Feather name={show ? 'eye-off' : 'eye'} size={17} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, saveConfig } = useConfig();
  const { logout, session } = useAuth();
  const { selectedPrinter, saveSelectedPrinter, clearSelectedPrinter } = usePrinter();

  const [form, setForm] = useState<MikroTikConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [printers, setPrinters] = useState<BluetoothPrinter[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  function updateField(key: keyof MikroTikConfig, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setTestResult(null);
  }

  async function handleTest() {
    if (!form.ip.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la dirección IP del router');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(form);
    await Haptics.notificationAsync(
      result.success
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
    setTestResult(result);
    setTesting(false);
  }

  async function handleSave() {
    if (!form.ip.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la IP del router');
      return;
    }
    setSaving(true);
    await saveConfig(form);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    Alert.alert('Guardado', 'Configuración guardada correctamente');
  }

  async function handleFindPrinters() {
    setLoadingPrinters(true);
    const result = await getPairedBluetoothPrinters();
    setLoadingPrinters(false);
    if (!result.success) {
      Alert.alert('Bluetooth', result.error || 'No se pudieron cargar las impresoras emparejadas.');
      return;
    }
    setPrinters(result.printers);
    if (result.printers.length === 0) {
      Alert.alert('Sin impresoras', 'Empareja primero la impresora desde los ajustes Bluetooth del teléfono.');
    }
  }

  async function handleSelectPrinter(printer: BluetoothPrinter) {
    await saveSelectedPrinter(printer);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Impresora seleccionada', printer.name || printer.id);
  }

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom: insets.bottom + 40 }]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerArea}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Ajustes</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Configuración de MikroTik
        </Text>
      </View>

      {/* MikroTik config card */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="router-wireless" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conexión MikroTik</Text>
        </View>

        <SettingInput
          label="Dirección IP del Router"
          value={form.ip}
          onChangeText={(t) => updateField('ip', t)}
          placeholder="192.168.88.1"
          keyboardType="default"
        />
        <SettingInput
          label="Usuario API"
          value={form.user}
          onChangeText={(t) => updateField('user', t)}
          placeholder="admin"
        />
        <SettingInput
          label="Contraseña API"
          value={form.password}
          onChangeText={(t) => updateField('password', t)}
          placeholder="••••••••"
          secureTextEntry
        />
        <SettingInput
          label="Nombre del Servidor Hotspot"
          value={form.hotspotServer}
          onChangeText={(t) => updateField('hotspotServer', t)}
          placeholder="hotspot1"
        />
        <SettingInput
          label="Nombre de la Red WiFi (para ticket)"
          value={form.wifiName}
          onChangeText={(t) => updateField('wifiName', t)}
          placeholder="Mi WiFi"
          autoCapitalize="sentences"
        />

        {/* Test connection result */}
        {testResult && (
          <View
            style={[
              styles.testResult,
              {
                backgroundColor: testResult.success ? colors.success + '22' : colors.destructive + '22',
                borderColor: testResult.success ? colors.success + '55' : colors.destructive + '55',
              },
            ]}
          >
            <Feather
              name={testResult.success ? 'check-circle' : 'x-circle'}
              size={16}
              color={testResult.success ? colors.success : colors.destructive}
            />
            <Text
              style={[
                styles.testResultText,
                { color: testResult.success ? colors.success : colors.destructive },
              ]}
            >
              {testResult.message}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.btnRow}>
          <Pressable
            onPress={handleTest}
            disabled={testing}
            style={({ pressed }) => [
              styles.testBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="activity" size={16} color={colors.primary} />
            )}
            <Text style={[styles.testBtnText, { color: colors.primary }]}>
              {testing ? 'Probando...' : 'Probar'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Feather name="save" size={16} color={colors.primaryForeground} />
            )}
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bluetooth printer */}
      {Platform.OS === 'android' && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bluetooth" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Impresora Bluetooth
            </Text>
          </View>
          <Text style={[styles.printerHint, { color: colors.mutedForeground }]}>
            Empareja la impresora en Android y selecciónala aquí para imprimir tickets térmicos directamente.
          </Text>
          {!isBluetoothPrinterAvailable() && (
            <Text style={[styles.printerWarning, { color: colors.warning }]}>
              La impresión directa estará disponible en el APK personalizado, no en Expo Go.
            </Text>
          )}
          {selectedPrinter && (
            <View style={[styles.selectedPrinter, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="printer-check" size={20} color={colors.success} />
              <View style={styles.selectedPrinterInfo}>
                <Text style={[styles.selectedPrinterName, { color: colors.foreground }]}>
                  {selectedPrinter.name || 'Impresora sin nombre'}
                </Text>
                <Text style={[styles.selectedPrinterId, { color: colors.mutedForeground }]}>
                  {selectedPrinter.id}
                </Text>
              </View>
              <Pressable onPress={clearSelectedPrinter} hitSlop={10}>
                <Feather name="x-circle" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}
          <Pressable
            onPress={handleFindPrinters}
            disabled={loadingPrinters}
            style={({ pressed }) => [
              styles.printerScanBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed || loadingPrinters ? 0.7 : 1 },
            ]}
          >
            {loadingPrinters ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="search" size={16} color={colors.primary} />
            )}
            <Text style={[styles.testBtnText, { color: colors.primary }]}>
              {loadingPrinters ? 'Buscando...' : 'Buscar emparejadas'}
            </Text>
          </Pressable>
          {printers.map((printer) => (
            <Pressable
              key={printer.id}
              onPress={() => handleSelectPrinter(printer)}
              style={({ pressed }) => [
                styles.printerRow,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="printer-outline" size={19} color={colors.primary} />
              <View style={styles.selectedPrinterInfo}>
                <Text style={[styles.selectedPrinterName, { color: colors.foreground }]}>
                  {printer.name || 'Impresora sin nombre'}
                </Text>
                <Text style={[styles.selectedPrinterId, { color: colors.mutedForeground }]}>
                  {printer.id}
                </Text>
              </View>
              <Feather
                name={selectedPrinter?.id === printer.id ? 'check-circle' : 'chevron-right'}
                size={18}
                color={selectedPrinter?.id === printer.id ? colors.success : colors.mutedForeground}
              />
            </Pressable>
          ))}
        </View>
      )}

      {/* License status card */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="certificate-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Licencia de acceso</Text>
        </View>
        <Text style={[styles.licenseName, { color: colors.foreground }]}>
          {session?.account.name ?? 'Cuenta HotSpot'}
        </Text>
        <Text style={[styles.licenseEmail, { color: colors.mutedForeground }]}>
          {session?.account.email ?? 'Sin sesión remota'}
        </Text>
        <View style={styles.licenseMeta}>
          <Text style={[styles.licenseMetaText, { color: colors.mutedForeground }]}>
            Estado: {session?.license.status === 'active' ? 'Activa' : 'No activa'}
          </Text>
          <Text style={[styles.licenseMetaText, { color: colors.mutedForeground }]}>
            Vence: {session ? new Date(session.license.expiresAt).toLocaleDateString() : '—'}
          </Text>
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={() =>
          Alert.alert('Cerrar Sesión', '¿Cerrar sesión de administrador?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: logout },
          ])
        }
        style={({ pressed }) => [
          styles.logoutBtn,
          { borderColor: colors.destructive + '66', opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Cerrar Sesión</Text>
      </Pressable>

      {/* App info */}
      <Text style={[styles.appInfo, { color: colors.mutedForeground }]}>
        HotSpot Manager · MikroTik RouterOS v7 · REST API
      </Text>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  headerArea: { paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  testResultText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  testBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  printerHint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  printerWarning: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  selectedPrinter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  selectedPrinterInfo: { flex: 1, gap: 2 },
  selectedPrinterName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  selectedPrinterId: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  printerScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  printerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  licenseName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  licenseEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 3 },
  licenseMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 8 },
  licenseMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium', flexShrink: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  appInfo: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 8,
  },
});
