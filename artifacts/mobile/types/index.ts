export interface Plan {
  id: string;
  name: string;
  type: 'hours' | 'days';
  duration: number;
  price: number;
  uploadSpeed: number; // Mbps
  downloadSpeed: number; // Mbps
  mikrotikProfile?: string;
}

export interface Ticket {
  id: string;
  username: string;
  password: string;
  planId: string;
  planName: string;
  durationLabel: string;
  price: number;
  limitUptime: string;
  rateLimit: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  mikrotikUserId: string;
}

export interface MikroTikConfig {
  ip: string;
  user: string;
  password: string;
  hotspotServer: string;
  wifiName: string;
}

export function getPlanProfileName(planId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < planId.length; i += 1) {
    hash ^= planId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `app-plan-${(hash >>> 0).toString(36)}`;
}
