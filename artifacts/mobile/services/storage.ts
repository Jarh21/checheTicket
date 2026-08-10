import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  LICENSE_TOKEN: '@hotspot/license_token',
  LICENSE_DEVICE_ID: '@hotspot/license_device_id',
  MIKROTIK_CONFIG: '@hotspot/mikrotik_config',
  PLANS: '@hotspot/plans',
  TICKETS: '@hotspot/tickets',
  BLUETOOTH_PRINTER: '@hotspot/bluetooth_printer',
  BIOMETRIC_ENABLED: '@hotspot/biometric_enabled',
  PORTAL_CONFIG: '@hotspot/portal_config',
};

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
