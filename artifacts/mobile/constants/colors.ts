/**
 * Dark tech/network theme for HotSpot Manager.
 * Both light and dark use the same dark palette — this is an admin tool.
 */

const darkTheme = {
  // Legacy aliases
  text: '#F9FAFB',
  tint: '#00C2FF',

  // Core surfaces
  background: '#0A0F1E',
  foreground: '#F9FAFB',

  // Cards / elevated surfaces
  card: '#111827',
  cardForeground: '#F9FAFB',

  // Primary (cyan)
  primary: '#00C2FF',
  primaryForeground: '#0A0F1E',

  // Secondary
  secondary: '#1E293B',
  secondaryForeground: '#94A3B8',

  // Muted
  muted: '#1E293B',
  mutedForeground: '#64748B',

  // Accent
  accent: '#00C2FF',
  accentForeground: '#0A0F1E',

  // Destructive
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  // Borders / inputs
  border: '#1E293B',
  input: '#1E293B',

  // Extra semantic colors used in components
  success: '#10B981',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningForeground: '#FFFFFF',
};

const colors = {
  light: darkTheme,
  dark: darkTheme,
  radius: 12,
};

export default colors;
