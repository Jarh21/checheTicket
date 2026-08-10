import { getAdminToken } from './auth';

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 204) return null as T;
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as Record<string, unknown>;
    throw new Error((err.error as string) || `HTTP ${res.status}`);
  }
  return body as T;
}

// ─── Email Config ───────────────────────────────────────────────────────────

export interface EmailConfigData {
  gmailUser: string | null;
  hasConfig: boolean;
}

export async function getEmailConfig(): Promise<EmailConfigData> {
  return adminFetch<EmailConfigData>('/api/admin/email-config');
}

export async function saveEmailConfig(data: {
  gmailUser: string;
  gmailAppPassword: string;
}): Promise<void> {
  await adminFetch('/api/admin/email-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Password Change Logs ───────────────────────────────────────────────────

export interface PasswordChangeLog {
  id: string;
  email: string;
  deviceId: string | null;
  deviceName: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export async function listPasswordChangeLogs(): Promise<PasswordChangeLog[]> {
  return adminFetch<PasswordChangeLog[]>('/api/admin/password-change-logs');
}
