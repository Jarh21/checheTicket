import { MikroTikConfig } from '@/types';

// Pure-JS base64 encoder for React Native compatibility
function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const b1 = str.charCodeAt(i);
    const b2 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const b3 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
    output +=
      chars[b1 >> 2] +
      chars[((b1 & 3) << 4) | (b2 >> 4)] +
      (i + 1 < str.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=') +
      (i + 2 < str.length ? chars[b3 & 63] : '=');
  }
  return output;
}

function getAuthHeader(config: MikroTikConfig): string {
  return `Basic ${toBase64(`${config.user}:${config.password}`)}`;
}

function getBaseUrl(config: MikroTikConfig): string {
  return `http://${config.ip}/rest`;
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

export interface TestResult {
  success: boolean;
  message: string;
}

export async function testConnection(config: MikroTikConfig): Promise<TestResult> {
  try {
    const response = await fetchWithTimeout(
      `${getBaseUrl(config)}/ip/hotspot`,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
      },
      6000,
    );

    if (response.ok) {
      return { success: true, message: 'Conexión exitosa con MikroTik' };
    } else if (response.status === 401) {
      return { success: false, message: 'Credenciales incorrectas' };
    } else if (response.status === 404) {
      return { success: false, message: 'Ruta no encontrada. Verifica la IP' };
    } else {
      return { success: false, message: `Error HTTP ${response.status}` };
    }
  } catch (error: unknown) {
    const e = error as Error;
    if (e.name === 'AbortError') {
      return { success: false, message: 'Tiempo de conexión agotado (6s)' };
    }
    return { success: false, message: 'No se pudo conectar al router' };
  }
}

export interface CreateUserParams {
  username: string;
  password: string;
  limitUptime: string;
  rateLimit: string;
}

interface MikroTikUserProfile {
  '.id': string;
  name: string;
  'rate-limit'?: string;
}

export interface MikroTikUser {
  '.id': string;
  name: string;
  password: string;
  'limit-uptime'?: string;
  profile?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

function getResponseError(status: number, text: string): string {
  return `Error ${status}: ${text || 'Respuesta vacía del MikroTik'}`;
}

function makeProfileName(rateLimit: string): string {
  // Keep the name deterministic so plans with the same speed reuse one profile.
  let hash = 2166136261;
  for (let i = 0; i < rateLimit.length; i += 1) {
    hash ^= rateLimit.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `hotspot-app-${(hash >>> 0).toString(36)}`;
}

async function ensureHotspotUserProfile(
  config: MikroTikConfig,
  rateLimit: string,
): Promise<{ success: boolean; profile?: string; error?: string }> {
  const profilesUrl = `${getBaseUrl(config)}/ip/hotspot/user/profile`;

  try {
    const listResponse = await fetchWithTimeout(
      profilesUrl,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
      },
      8000,
    );

    if (!listResponse.ok) {
      return {
        success: false,
        error: getResponseError(listResponse.status, await listResponse.text()),
      };
    }

    const profiles = (await listResponse.json()) as MikroTikUserProfile[];
    const matchingProfile = profiles.find(
      (profile) => profile['rate-limit'] === rateLimit,
    );
    if (matchingProfile) {
      return { success: true, profile: matchingProfile.name };
    }

    let profileName = makeProfileName(rateLimit);
    const conflictingProfile = profiles.find((profile) => profile.name === profileName);
    if (conflictingProfile && conflictingProfile['rate-limit'] !== rateLimit) {
      profileName = `${profileName}-${Date.now().toString(36).slice(-5)}`;
    }

    const createResponse = await fetchWithTimeout(
      profilesUrl,
      {
        method: 'PUT',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileName,
          'rate-limit': rateLimit,
        }),
      },
      10000,
    );

    if (createResponse.ok) {
      return { success: true, profile: profileName };
    }

    return {
      success: false,
      error: getResponseError(createResponse.status, await createResponse.text()),
    };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'No se pudo configurar el perfil de velocidad' };
  }
}

export async function createHotspotUser(
  config: MikroTikConfig,
  params: CreateUserParams,
): Promise<CreateUserResult> {
  try {
    const profileResult = params.rateLimit
      ? await ensureHotspotUserProfile(config, params.rateLimit)
      : { success: true as const, profile: 'default' };

    if (!profileResult.success || !profileResult.profile) {
      return {
        success: false,
        error: `No se pudo configurar la velocidad del plan: ${
          profileResult.error || 'perfil no disponible'
        }`,
      };
    }

    const body: Record<string, string> = {
      name: params.username,
      password: params.password,
      profile: profileResult.profile,
    };

    if (params.limitUptime) body['limit-uptime'] = params.limitUptime;

    const response = await fetchWithTimeout(
      `${getBaseUrl(config)}/ip/hotspot/user`,
      {
        method: 'PUT',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      10000,
    );

    if (response.ok) {
      const data = (await response.json()) as MikroTikUser;
      return { success: true, userId: data['.id'] };
    } else {
      const text = await response.text();
      return { success: false, error: getResponseError(response.status, text) };
    }
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'Error al crear usuario' };
  }
}

export async function deleteHotspotUser(
  config: MikroTikConfig,
  userId: string,
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${getBaseUrl(config)}/ip/hotspot/user/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: getAuthHeader(config) },
      },
      6000,
    );
    return response.ok;
  } catch {
    return false;
  }
}

export function formatLimitUptime(type: 'hours' | 'days', duration: number): string {
  if (type === 'hours') {
    return `${String(duration).padStart(2, '0')}:00:00`;
  }
  return `${duration}d 00:00:00`;
}

export function formatRateLimit(uploadMbps: number, downloadMbps: number): string {
  return `${downloadMbps}M/${uploadMbps}M`;
}

export function generateUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'h';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateTicketPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function makeDurationLabel(type: 'hours' | 'days', duration: number): string {
  if (type === 'hours') {
    return duration === 1 ? '1 Hora' : `${duration} Horas`;
  }
  return duration === 1 ? '1 Día' : `${duration} Días`;
}
