import { getLicenseSession, loginLicense, logoutLicense, setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { Platform } from 'react-native';
import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/services/storage';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) {
  setBaseUrl(`https://${domain}`);
}
setAuthTokenGetter(() => getItem<string>(STORAGE_KEYS.LICENSE_TOKEN));

function createDeviceId(): string {
  const random = Math.random().toString(36).slice(2);
  return `${Platform.OS}-${Date.now().toString(36)}-${random}`;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem<string>(STORAGE_KEYS.LICENSE_DEVICE_ID);
  if (existing) return existing;
  const deviceId = createDeviceId();
  await setItem(STORAGE_KEYS.LICENSE_DEVICE_ID, deviceId);
  return deviceId;
}

export async function loginWithLicense(email: string, password: string) {
  const deviceId = await getOrCreateDeviceId();
  const response = await loginLicense({
    email: email.trim().toLowerCase(),
    password,
    deviceId,
    deviceName: Platform.OS === 'android' ? 'Android' : 'Dispositivo móvil',
  });
  await setItem(STORAGE_KEYS.LICENSE_TOKEN, response.token);
  return response.session;
}

export async function restoreLicenseSession() {
  const token = await getItem<string>(STORAGE_KEYS.LICENSE_TOKEN);
  if (!token) return null;
  try {
    return await getLicenseSession();
  } catch {
    await removeItem(STORAGE_KEYS.LICENSE_TOKEN);
    return null;
  }
}

export async function logoutLicenseSession() {
  try {
    if (await getItem<string>(STORAGE_KEYS.LICENSE_TOKEN)) {
      await logoutLicense();
    }
  } finally {
    await removeItem(STORAGE_KEYS.LICENSE_TOKEN);
  }
}