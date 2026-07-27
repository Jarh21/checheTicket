import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isFirstLaunch, isLoading, login, setupPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  async function handleSubmit() {
    setError('');
    if (!password.trim()) {
      setError('Ingresa una contraseña');
      return;
    }

    if (isFirstLaunch) {
      if (password.length < 4) {
        setError('Mínimo 4 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('Las contraseñas no coinciden');
        return;
      }
      setSubmitting(true);
      await setupPassword(password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSubmitting(true);
      const ok = await login(password);
      if (!ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('Contraseña incorrecta');
        setPassword('');
        setSubmitting(false);
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 40),
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + '22' }]}>
            <MaterialCommunityIcons name="router-wireless" size={52} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>HotSpot Manager</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            MikroTik · Tickets · Bluetooth
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {isFirstLaunch ? 'Configurar Contraseña' : 'Administrador'}
          </Text>
          {isFirstLaunch && (
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Crea una contraseña para proteger la app
            </Text>
          )}

          {/* Password input */}
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.input, borderColor: error ? colors.destructive : colors.border },
            ]}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder={isFirstLaunch ? 'Nueva contraseña' : 'Contraseña'}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={isFirstLaunch ? 'next' : 'done'}
              onSubmitEditing={isFirstLaunch ? undefined : handleSubmit}
            />
            <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10}>
              <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Confirm password (first launch only) */}
          {isFirstLaunch && (
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
                secureTextEntry={!showPwd}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          )}

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed || submitting ? 0.8 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {isFirstLaunch ? 'Crear Contraseña' : 'Ingresar'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
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
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  cardSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: -8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
