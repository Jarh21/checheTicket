import { getPlanProfileName, MikroTikConfig } from '@/types';

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
  profileName: string;
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

export async function ensureHotspotUserProfile(
  config: MikroTikConfig,
  profileName: string,
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
    const existingProfile = profiles.find((profile) => profile.name === profileName);
    if (existingProfile) {
      if (existingProfile['rate-limit'] === rateLimit) {
        return { success: true, profile: profileName };
      }

      const updateResponse = await fetchWithTimeout(
        `${profilesUrl}/${encodeURIComponent(existingProfile['.id'])}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: getAuthHeader(config),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 'rate-limit': rateLimit }),
        },
        10000,
      );

      if (!updateResponse.ok) {
        return {
          success: false,
          error: getResponseError(updateResponse.status, await updateResponse.text()),
        };
      }

      return { success: true, profile: profileName };
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

    if (!createResponse.ok) {
      return {
        success: false,
        error: getResponseError(createResponse.status, await createResponse.text()),
      };
    }

    return { success: true, profile: profileName };
  } catch (error: unknown) {
    const e = error as Error;
    return { success: false, error: e.message || 'No se pudo sincronizar el perfil de velocidad' };
  }
}

export async function createHotspotUser(
  config: MikroTikConfig,
  params: CreateUserParams,
): Promise<CreateUserResult> {
  try {
    const profileResult = await ensureHotspotUserProfile(
      config,
      params.profileName || getPlanProfileName(params.username),
      params.rateLimit,
    );

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

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

export async function deleteHotspotUser(
  config: MikroTikConfig,
  userId: string,
  username?: string,
): Promise<DeleteUserResult> {
  try {
    let targetId = userId;

    // Older locally stored tickets may not have saved the RouterOS .id.
    // Find those users by their stable username before deleting.
    if (!targetId && username) {
      const listResponse = await fetchWithTimeout(
        `${getBaseUrl(config)}/ip/hotspot/user`,
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

      const users = (await listResponse.json()) as MikroTikUser[];
      targetId = users.find((user) => user.name === username)?.['.id'] || '';
    }

    if (!targetId) {
      // The user is already absent from MikroTik; desired state is achieved.
      return { success: true };
    }

    const response = await fetchWithTimeout(
      `${getBaseUrl(config)}/ip/hotspot/user/${encodeURIComponent(targetId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: getAuthHeader(config) },
      },
      6000,
    );

    if (response.ok || response.status === 404) {
      // 404 means the desired state is already achieved: the user is absent.
      return { success: true };
    }

    return {
      success: false,
      error: getResponseError(response.status, await response.text()),
    };
  } catch (error: unknown) {
    const e = error as Error;
    return {
      success: false,
      error: e.name === 'AbortError'
        ? 'Tiempo de conexión agotado al eliminar el usuario de MikroTik.'
        : e.message || 'No se pudo eliminar el usuario de MikroTik.',
    };
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

// ─── Hotspot portal upload ────────────────────────────────────────────────────

export interface UploadPortalResult {
  success: boolean;
  error?: string;
}

/**
 * Uploads a custom HTML login page to the MikroTik router.
 * Searches for "flash/hotspot/login.html" (or "hotspot/login.html") in the
 * router file list and PATCHes its contents; creates it if absent.
 *
 * RouterOS REST requires file contents sent as base64.
 * The HTML must be ASCII-safe before calling this function.
 */
export async function uploadHotspotPortal(
  config: MikroTikConfig,
  html: string,
): Promise<UploadPortalResult> {
  const base64Content = toBase64(html);
  const candidateNames = ['flash/hotspot/login.html', 'hotspot/login.html'];

  try {
    // 1. List all files to find the existing login template
    const listRes = await fetchWithTimeout(
      `${getBaseUrl(config)}/file`,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
      },
      8000,
    );

    if (!listRes.ok) {
      return {
        success: false,
        error: `No se pudo listar archivos del router (${listRes.status})`,
      };
    }

    const files = (await listRes.json()) as Array<{ '.id': string; name: string }>;
    const existing = files.find((f) => candidateNames.includes(f.name));

    if (existing) {
      // 2a. Update the existing file
      const patchRes = await fetchWithTimeout(
        `${getBaseUrl(config)}/file/${encodeURIComponent(existing['.id'])}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: getAuthHeader(config),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contents: base64Content }),
        },
        12000,
      );

      if (patchRes.ok) return { success: true };
      return {
        success: false,
        error: `Error al actualizar el archivo (${patchRes.status})`,
      };
    }

    // 2b. Create the file for the first time
    const putRes = await fetchWithTimeout(
      `${getBaseUrl(config)}/file`,
      {
        method: 'PUT',
        headers: {
          Authorization: getAuthHeader(config),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'flash/hotspot/login.html',
          contents: base64Content,
        }),
      },
      12000,
    );

    if (putRes.ok) return { success: true };
    return {
      success: false,
      error: `Error al crear el archivo en el router (${putRes.status}). Verifica que el directorio flash/hotspot exista.`,
    };
  } catch (error: unknown) {
    const e = error as Error;
    return {
      success: false,
      error:
        e.name === 'AbortError'
          ? 'Tiempo de conexión agotado'
          : e.message || 'Error al conectar con el router',
    };
  }
}

// ─── Duration / rate helpers ──────────────────────────────────────────────────

export function makeDurationLabel(type: 'hours' | 'days', duration: number): string {
  if (type === 'hours') {
    return duration === 1 ? '1 Hora' : `${duration} Horas`;
  }
  return duration === 1 ? '1 Día' : `${duration} Días`;
}
