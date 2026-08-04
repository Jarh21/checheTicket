---
name: Bluetooth thermal printing
description: Restricciones y protocolo usado para imprimir tickets en impresoras térmicas Bluetooth.
---

La impresión directa de tickets usa Bluetooth Classic con comandos ESC/POS para impresoras térmicas Android de 58 mm.

**Why:** Expo Go no incluye módulos nativos Bluetooth; además, `requireNativeModule` registra el módulo faltante antes de que un `try/catch` pueda ocultarlo. La función real requiere un APK personalizado con permisos BLUETOOTH_SCAN y BLUETOOTH_CONNECT.

**How to apply:** Detectar Expo Go mediante `expo-constants` antes de intentar cargar el paquete y no comprobar disponibilidad llamando al paquete durante el render. Mantener la impresión del sistema como alternativa. Si una impresora es BLE, WiFi o iOS/MFi, necesita otro transporte y no debe asumirse compatibilidad con Bluetooth Classic.