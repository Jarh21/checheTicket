import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';
import { PassnetLogo } from '@/components/PassnetLogo';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, login, biometricLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    (async () => {
      try {
        const hardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (hardware && enrolled) {
          const enabled = await getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
          setBiometricReady(!!enabled);
        }
      } catch {
        setBiometricReady(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <PassnetLogo size="large" />
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
      </View>
    );
  }

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo válido');
      return;
    }
    if (!password.trim()) {
      setError('Ingresa tu contraseña');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.message ?? 'No se pudo iniciar sesión');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (hardware && enrolled && !biometricReady) {
        // Small delay to let navigation settle
        setTimeout(() => {
          import('react-native').then(({ Alert }) => {
            Alert.alert(
              'Inicio rápido con huella',
              '¿Deseas habilitar el inicio de sesión con huella digital?',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Sí',
                  onPress: async () => {
                    await setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, true);
                    setBiometricReady(true);
                  },
                },
              ],
            );
          });
        }, 800);
      }
    } catch {
      // ignore
    }
  }

  async function handleBiometricLogin() {
    setBiometricLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        setBiometricLoading(false);
        return;
      }
      const loginResult = await biometricLogin();
      if (!loginResult.ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(loginResult.message ?? 'Sesión expirada');
        await setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, false);
        setBiometricReady(false);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError('No se pudo autenticar con huella');
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo — native component, no image transparency issues */}
        <View style={styles.logoArea}>
          <PassnetLogo size="large" />
        </View>

        {/* Login card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Acceso de cliente
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            Ingresa con la cuenta y licencia asignadas
          </Text>

          {/* Email */}
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.input,
                borderColor: focusedField === 'email'
                  ? colors.primary
                  : error
                    ? colors.destructive
                    : colors.border,
                borderWidth: focusedField === 'email' ? 1.5 : 1,
              },
            ]}
          >
            <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => inputRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.input,
                borderColor: focusedField === 'password'
                  ? colors.primary
                  : error
                    ? colors.destructive
                    : colors.border,
                borderWidth: focusedField === 'password' ? 1.5 : 1,
              },
            ]}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Contraseña"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10}>
              <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          {/* Ingresar button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed || submitting ? 0.82 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                Ingresar
              </Text>
            )}
          </Pressable>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            {biometricReady && (
              <Pressable
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                style={({ pressed }) => [
                  styles.biometricBtn,
                  { borderColor: colors.border, backgroundColor: colors.input, opacity: pressed || biometricLoading ? 0.7 : 1 },
                ]}
              >
                {biometricLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <MaterialCommunityIcons name="fingerprint" size={26} color={colors.primary} />
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push('/forgot-password')}
              hitSlop={10}
              style={[styles.forgotBtn, !biometricReady && styles.forgotBtnFull]}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 36,
  },
  logoArea: {
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 28,
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#1B2E4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  cardSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginTop: -4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputIcon: {
    marginRight: 10,
  },
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
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  biometricBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotBtn: {
    paddingVertical: 8,
  },
  forgotBtnFull: {
    flex: 1,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
