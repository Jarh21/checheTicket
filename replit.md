# HotSpot Manager

App móvil (Expo/React Native) para administrar usuarios de hotspot MikroTik RouterOS v7, generar tickets con credenciales y compartirlos/imprimirlos.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — Expo dev server (escanear QR con Expo Go)
- `pnpm --filter @workspace/api-server run dev` — API Server Express (puerto 5000)
- `pnpm run typecheck` — typecheck completo de todos los paquetes

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, Expo Router (file-based routing)
- Estado: React Context + AsyncStorage (sin backend para datos de la app)
- API MikroTik: HTTP directo a la red local (REST API RouterOS v7)
- Impresión: expo-print (HTML/PDF), expo-sharing (compartir texto)
- Autenticación: PIN local en AsyncStorage

## Módulos de la App

- **Login** — Contraseña admin local (primera vez: configurar; después: login)
- **Panel (Dashboard)** — Estadísticas, selector de plan, generación de ticket
- **Planes** — CRUD de planes (horas/días, precio, velocidad up/down en Mbps)
- **Historial** — Tickets activos/vencidos, reimpresión, limpieza de vencidos
- **Ajustes** — Credenciales MikroTik (IP, usuario, contraseña, hotspot server, WiFi name)

## Arquitectura

- Sin backend propio — la app llama directo a la REST API del MikroTik
- MikroTik REST API: `http://<ip>/rest` con Basic Auth
- Crear usuario hotspot: `PUT /rest/ip/hotspot/user` con `limit-uptime` y `rate-limit`
- Credenciales MikroTik + datos de tickets almacenados en AsyncStorage

## Where things live

- `artifacts/mobile/` — App Expo completa
- `artifacts/mobile/app/` — Rutas Expo Router
- `artifacts/mobile/contexts/` — Auth, Config, Plans, Tickets (React Context)
- `artifacts/mobile/services/` — mikrotik.ts (REST API), printer.ts, storage.ts
- `artifacts/mobile/components/` — PlanCard, TicketCard, StatusBadge, GeneratedTicketModal
- `artifacts/mobile/types/index.ts` — Interfaces TypeScript (Plan, Ticket, MikroTikConfig)

## User preferences

- Impresora: MP58-040, 58mm, Bluetooth (ESC/POS)
- La impresión actual usa expo-print (sistema). ESC/POS nativo requiere build personalizado
- Un solo administrador, sin multi-usuario
- Plataforma objetivo actual: Android; la navegación usa MaterialCommunityIcons compatibles con Expo Go
- Tema: oscuro forzado (red/tech)
- Idioma: Español

## Gotchas

- Los paquetes expo-print/expo-sharing deben usarse en versión ~57.x (compatible con Expo 54)
  Las versiones ~15.x / ~14.x tienen bug de directorio temporal en instalación pnpm
- `btoa` está disponible en React Native moderno (Expo SDK 54 / RN 0.81)
- No usar `uuid` — usar generador manual de IDs
