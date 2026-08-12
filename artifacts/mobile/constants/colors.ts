/**
 * Blanco Ostra (Oyster White) theme for PASSNET WIFI.
 * Warm off-white background, dark navy primary matching the brand logo.
 */

const lightTheme = {
  // Legacy aliases
  text: '#1B2E4B',
  tint: '#1B3A6E',

  // Core surfaces
  background: '#F4EFE6',
  foreground: '#1B2E4B',

  // Cards / elevated surfaces
  card: '#FFFFFF',
  cardForeground: '#1B2E4B',

  // Primary (navy blue — matches PASSNET logo)
  primary: '#1B3A6E',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#EDE8DF',
  secondaryForeground: '#4A6080',

  // Muted
  muted: '#EDE8DF',
  mutedForeground: '#7A6E62',

  // Accent (yellow from logo)
  accent: '#F5A623',
  accentForeground: '#1B2E4B',

  // Destructive
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',

  // Borders / inputs
  border: '#DDD5C8',
  input: '#EDE8DF',

  // Extra semantic colors
  success: '#16A34A',
  successForeground: '#FFFFFF',
  warning: '#D97706',
  warningForeground: '#FFFFFF',
};

const colors = {
  light: lightTheme,
  dark: lightTheme, // single palette — oyster white for all modes
  radius: 14,
};

export default colors;
