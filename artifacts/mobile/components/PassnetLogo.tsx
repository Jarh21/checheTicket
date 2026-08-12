import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PassnetLogoProps {
  size?: 'small' | 'medium' | 'large';
}

/**
 * PASSNET WIFI brand logo — rendered natively.
 * Matches the brand colors: navy (#1B3A6E), yellow (#F5A623), teal (#1B8CA6).
 */
export function PassnetLogo({ size = 'large' }: PassnetLogoProps) {
  const scale = size === 'large' ? 1 : size === 'medium' ? 0.75 : 0.55;

  const iconSize = Math.round(52 * scale);
  const brand = Math.round(40 * scale);
  const sub = Math.round(16 * scale);
  const gap = Math.round(6 * scale);

  return (
    <View style={styles.wrapper}>
      {/* Icon row: ticket + wifi arcs + arrow */}
      <View style={[styles.iconRow, { gap: Math.round(2 * scale) }]}>
        {/* Ticket stub */}
        <MaterialCommunityIcons
          name="ticket"
          size={iconSize}
          color="#1B3A6E"
        />
        {/* WiFi signal (yellow) */}
        <MaterialCommunityIcons
          name="wifi"
          size={Math.round(iconSize * 0.75)}
          color="#F5A623"
          style={{ marginLeft: -Math.round(16 * scale), marginTop: Math.round(2 * scale) }}
        />
        {/* Arrow right (teal) */}
        <MaterialCommunityIcons
          name="arrow-right-bold"
          size={Math.round(iconSize * 0.55)}
          color="#1B8CA6"
          style={{ marginLeft: -Math.round(6 * scale) }}
        />
      </View>

      {/* Brand name */}
      <View style={[styles.textBlock, { marginTop: gap }]}>
        <Text style={[styles.brandText, { fontSize: brand, letterSpacing: brand * 0.06 }]}>
          PASSNET
        </Text>
        <Text style={[styles.subText, { fontSize: sub, letterSpacing: sub * 0.25, marginTop: -Math.round(2 * scale) }]}>
          WIFI
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
  },
  brandText: {
    fontFamily: 'Inter_700Bold',
    color: '#1B3A6E',
  },
  subText: {
    fontFamily: 'Inter_500Medium',
    color: '#4A6080',
  },
});
