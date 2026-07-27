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
import { MikroTikConfig } from '@/types';
import { testConnection } from '@/services/mikrotik';
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
  const { logout, changePassword } = useAuth();

  const [form, setForm] = useState<MikroTikConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Change password fields
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

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

  async function handleChangePassword() {
    setPwdError('');
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Completa todos los campos');
      return;
    }
    if (newPwd.length < 4) {
      setPwdError('Mínimo 4 caracteres');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Las contraseñas no coinciden');
      return;
    }
    setPwdSaving(true);
    const ok = await changePassword(currentPwd, newPwd);
    setPwdSaving(false);
    if (!ok) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPwdError('Contraseña actual incorrecta');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('Listo', 'Contraseña actualizada');
    }
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

      {/* Change password card */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="lock" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contraseña Admin</Text>
        </View>

        <SettingInput
          label="Contraseña actual"
          value={currentPwd}
          onChangeText={(t) => { setCurrentPwd(t); setPwdError(''); }}
          secureTextEntry
        />
        <SettingInput
          label="Nueva contraseña"
          value={newPwd}
          onChangeText={(t) => { setNewPwd(t); setPwdError(''); }}
          secureTextEntry
        />
        <SettingInput
          label="Confirmar nueva contraseña"
          value={confirmPwd}
          onChangeText={(t) => { setConfirmPwd(t); setPwdError(''); }}
          secureTextEntry
        />

        {pwdError ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{pwdError}</Text>
        ) : null}

        <Pressable
          onPress={handleChangePassword}
          disabled={pwdSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed || pwdSaving ? 0.85 : 1 },
          ]}
        >
          {pwdSaving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Actualizar Contraseña
            </Text>
          )}
        </Pressable>
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
