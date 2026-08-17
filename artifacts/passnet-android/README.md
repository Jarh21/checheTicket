# PASSNET WIFI — Android nativo

App Android nativa para administrar hotspots MikroTik RouterOS v7.  
Kotlin + Jetpack Compose + Gradle · **sin Expo, React Native ni EAS**.

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| JDK | 17.0.x (LTS) |
| Android Studio | Hedgehog / Iguana o más nuevo |
| Android SDK Platform | 35 (Android 15) |
| Android SDK Platform-Tools | 34.x o 37.x (adb) |
| Gradle Wrapper | 8.10.2 (descarga automática) |
| AGP | 8.7.3 |

---

## Configuración inicial

1. **Clona o descarga el proyecto.**

2. **Copia `local.properties.example` a `local.properties`:**

   ```bash
   cp local.properties.example local.properties
   ```

3. **Edita `local.properties`** y rellena:

   ```properties
   # URL del servidor de licencias PASSNET WIFI
   PASSNET_API_BASE_URL=https://tu-servidor.repl.co

   # Ruta del SDK Android (Android Studio lo rellena automáticamente)
   sdk.dir=/Users/tuusuario/Library/Android/sdk
   ```

4. **Abre el proyecto en Android Studio** (`File → Open → selecciona esta carpeta`).  
   Gradle sincronizará las dependencias automáticamente.

---

## Compilar

### APK de debug (para instalar directamente)

```bash
./gradlew :app:assembleDebug
```

El APK queda en:
```
app/build/outputs/apk/debug/app-debug.apk
```

### AAB de release (para publicar en Google Play)

1. Configura el keystore en `local.properties`:

   ```properties
   KEYSTORE_PATH=release.jks
   KEY_ALIAS=passnet
   KEYSTORE_PASSWORD=tu-contraseña
   KEY_PASSWORD=tu-contraseña-key
   ```

2. Genera el AAB:

   ```bash
   ./gradlew :app:bundleRelease
   ```

### Tests

```bash
./gradlew :app:test
./gradlew :app:lint
```

---

## Instalación en dispositivo

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Arquitectura

```
com.passnet.wifi
├── PassnetApp.kt             ← @HiltAndroidApp
├── MainActivity.kt           ← Splash, deep links, Compose host
├── navigation/
│   ├── Screen.kt             ← Rutas
│   └── AppNavigation.kt      ← NavHost + barra inferior
├── ui/
│   ├── theme/                ← Color, Theme, Type (Material 3 oscuro)
│   ├── auth/                 ← Login, ForgotPassword, ResetPassword
│   ├── dashboard/            ← Panel principal + generación de tickets
│   ├── plans/                ← CRUD de planes
│   ├── history/              ← Historial de tickets
│   ├── settings/             ← MikroTik, Bluetooth, portal, licencia
│   └── components/           ← TicketModal (compartir/imprimir)
├── domain/model/             ← Plan, Ticket, MikroTikConfig, LicenseSession
├── data/
│   ├── local/                ← Room (planes y tickets) · SecureStorage (Keystore)
│   ├── remote/license/       ← Retrofit → API central de licencias
│   ├── remote/mikrotik/      ← OkHttp → RouterOS REST directo
│   ├── repository/           ← AuthRepository, PlanRepository, TicketRepository,
│   │                            MikroTikRepository
│   └── printer/              ← BluetoothPrinterManager + EscPosCommands
└── di/                       ← AppModule (Retrofit, OkHttp), DatabaseModule (Room)
```

---

## Flujo de autenticación

```
App inicia
  └─ Splash → restoreSession()
       ├─ 200 → Authenticated → Panel
       ├─ 401/403 → token borrado → Login
       └─ IOException → sesión preservada → Login (modo offline)
```

El token nunca se descarta por un error de red temporal.  
La expiración de la licencia la decide el servidor, nunca el reloj local.

---

## Impresión Bluetooth

- Requiere impresora Bluetooth Classic emparejada (Ajustes de Android → Bluetooth).
- Protocolo: RFCOMM/SPP, UUID `00001101-0000-1000-8000-00805F9B34FB`.
- Comandos: ESC/POS crudos (Base64) para rollo de 58 mm.
- Permisos: `BLUETOOTH_CONNECT` y `BLUETOOTH_SCAN` (Android 12+).

---

## Notas importantes

- **MikroTik**: La app llama directamente a `http://<ip>/rest` — sin backend intermedio.
- **Credenciales del router**: almacenadas en `EncryptedSharedPreferences` (Android Keystore AES-256).
- **URL del servidor de licencias**: inyectada en `BuildConfig` al compilar; no se puede cambiar desde la UI.
- **ESC/POS**: `EscPosCommands.kt` genera el contenido; `BluetoothPrinterManager.kt` lo envía.
- **Portal hotspot**: HTML ASCII-safe subido directamente a `flash/hotspot/login.html` en el router.
- **El asterisco en IDs de RouterOS** (ej. `*6`) no se debe codificar como `%2A` — el código lo preserva tal cual.

---

## gradle-wrapper.jar

El binario `gradle/wrapper/gradle-wrapper.jar` no está incluido.  
Android Studio lo descarga automáticamente al abrir el proyecto.  
Si usas la terminal, ejecuta primero:

```bash
gradle wrapper --gradle-version=8.10.2
```

o descárgalo desde un proyecto Android nuevo creado con Android Studio.
