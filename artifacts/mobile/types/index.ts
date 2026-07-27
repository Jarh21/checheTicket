export interface Plan {
  id: string;
  name: string;
  type: 'hours' | 'days';
  duration: number;
  price: number;
  uploadSpeed: number; // Mbps
  downloadSpeed: number; // Mbps
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
