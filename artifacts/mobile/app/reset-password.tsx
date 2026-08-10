import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmPasswordReset } from '@/services/password-reset';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 20);

  async function handleReset() {
    setError('');
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop, paddingBottom: insets.bottom + 32 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="shield" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Nueva contraseña
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Elige una contraseña segura para tu cuenta.
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {done ? (
            <View style={styles.successBlock}>
              <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
                <Feather name="check-circle" size={40} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                ¡Contraseña actualizada!
              </Text>
              <Text style={[styles.successText, { color: colors.mutedForeground }]}>
                Tu contraseña ha sido restablecida. Inicia sesión con tu nueva contraseña.
              </Text>
              <Pressable
                onPress={() => router.replace('/login')}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1, width: '100%' },
                ]}
              >
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                  Ir al inicio de sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {!token && (
                <View style={[styles.warningBox, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40' }]}>
                  <Feather name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={[styles.warningText, { color: colors.destructive }]}>
                    Enlace inválido. Solicita un nuevo correo de recuperación.
                  </Text>
                </View>
              )}

              {/* New password */}
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.input, borderColor: error ? colors.destructive : colors.border },
                ]}
              >
                <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPwd}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10}>
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              {/* Confirm password */}
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.input, borderColor: error ? colors.destructive : colors.border },
                ]}
              >
                <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showConfirm}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={10}>
                  <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleReset}
                disabled={loading || !token}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary, opacity: (pressed || loading || !token) ? 0.7 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                    Restablecer contraseña
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: -4,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  successBlock: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
