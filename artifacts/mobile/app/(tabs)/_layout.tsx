import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <MaterialCommunityIcons name="home-outline" size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name="home-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Planes',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <MaterialCommunityIcons name="clock-outline" size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name="clock-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <MaterialCommunityIcons name="cog-outline" size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name="cog-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  // Android is the current target. Keep the classic tab bar and bundled
  // MaterialCommunityIcons so no iOS SF Symbols are needed in Expo Go.
  return <ClassicTabLayout />;
}
