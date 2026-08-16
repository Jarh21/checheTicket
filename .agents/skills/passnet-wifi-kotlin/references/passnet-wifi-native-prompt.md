# Prompt maestro: PASSNET WIFI en Kotlin nativo

Actúa como arquitecto y desarrollador senior Android. Crea desde cero una
aplicación Android nativa llamada **PASSNET WIFI**, reemplazando una versión
previa hecha con Expo/React Native. Esta nueva versión debe usar **Kotlin,
Jetpack Compose, Material 3, Coroutines, ViewModel y Gradle**, y debe producir
un APK/AAB con el Android SDK y el Gradle Wrapper, sin Expo, EAS ni React
Native.

## Objetivo del producto

PASSNET WIFI administra usuarios de hotspot en MikroTik RouterOS v7. El
operador inicia sesión con una licencia central, configura un router local,
crea planes de acceso, genera tickets de usuario y contraseña, los guarda en
un historial y puede compartirlos o imprimirlos en una impresora Bluetooth
Classic ESC/POS de 58 mm.

La aplicación debe estar en español y usar un tema oscuro de estilo
tecnológico con rojo como color principal. La plataforma inicial es Android.

## Restricciones no negociables

1. No uses Expo, React Native, Flutter, Ionic, Capacitor ni EAS.
2. No inventes un backend alternativo.
3. El API central solo administra autenticación, licencia, sesión, cuentas y
   dispositivos.
4. El móvil llama directamente al MikroTik en la red local mediante
   `http://<ip>/rest` o HTTPS si está disponible.
5. No uses datos mock como sustituto de las operaciones reales.
6. No guardes contraseñas, tokens ni credenciales del router en texto plano.
7. No decidas la expiración de una licencia con el reloj local.
8. No declares éxito de impresión si el dispositivo Bluetooth no aceptó los
   bytes.
9. No borres una sesión guardada solo por un error temporal de red.
10. Todo trabajo de red, base de datos y Bluetooth debe ejecutarse fuera del
    hilo principal.

## Stack y compilación

Usa:

- Kotlin.
- Jetpack Compose + Material 3.
- Navigation Compose.
- ViewModel + StateFlow.
- Kotlin Coroutines.
- Room para planes y tickets.
- DataStore y Android Keystore/AndroidX Security para preferencias y secretos.
- Retrofit/OkHttp para la API central.
- OkHttp directo para RouterOS REST.
- Java 17.
- `minSdk = 26`.
- Gradle Kotlin DSL y Gradle Wrapper.

Organiza dependencias en `gradle/libs.versions.toml`. No fijes versiones
antiguas sin verificar compatibilidad con el Android Gradle Plugin vigente.

Debe funcionar:

```bash
./gradlew :app:assembleDebug
./gradlew :app:test
./gradlew :app:lint
./gradlew :app:bundleRelease
```

El APK de debug debe quedar en el directorio estándar de Gradle. El release
debe funcionar con un keystore suministrado por variables o propiedades de
Gradle, nunca con una contraseña escrita en el código.

## Configuración

Define la URL del API central mediante `BuildConfig` o `local.properties`.
Usa una URL de desarrollo y otra de producción. Nunca hardcodees secretos.

Variables esperadas:

- `PASSNET_API_BASE_URL`
- `PASSNET_ENVIRONMENT`

La URL del router se configura dentro de la pantalla de Ajustes y no se
confunde con la URL del API central.

## Arquitectura

Usa capas claras:

```text
ui -> viewmodel -> usecase/repository -> data/local o data/remote
```

Crea estados explícitos para carga, contenido, vacío y error. La UI no debe
hacer llamadas HTTP directamente. Usa modelos de dominio separados de los
DTOs del API y transforma errores a mensajes en español.

## Autenticación, sesión y licencias

Implementa estas pantallas:

- Login.
- Recuperar contraseña.
- Restablecer contraseña.
- Flujo principal autenticado.

El API central expone:

- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

El login debe enviar:

```json
{
  "email": "correo normalizado",
  "password": "contraseña",
  "deviceId": "identificador estable de instalación",
  "deviceName": "Android"
}
```

El response incluye un token de sesión y la sesión de licencia. Guarda el
token en almacenamiento protegido. En cada request autenticado usa
`Authorization: Bearer <token>`.

Al restaurar sesión:

- si el servidor responde 200, mostrar la app;
- si responde 401/403, borrar token y volver a login;
- si hay timeout o no hay Internet, conservar token y mostrar estado offline;
- no permitir asumir que una licencia está vigente solo porque hay token.

La interfaz de Ajustes debe mostrar nombre/correo, estado y fecha de
vencimiento recibidos del servidor.

## Modelo de datos

### Plan

```text
id: String
name: String
type: HOURS | DAYS
duration: Int
price: Double
uploadSpeed: Int
downloadSpeed: Int
mikrotikProfile: String?
synced: Boolean
```

### Ticket

```text
id: String
username: String
password: String
planId: String
planName: String
durationLabel: String
price: Double
limitUptime: String
rateLimit: String
createdAt: Instant
expiresAt: Instant
mikrotikUserId: String?
```

### Configuración MikroTik

```text
ip: String
user: String
password: String
hotspotServer: String
wifiName: String
```

La contraseña debe almacenarse cifrada. Los tickets y planes pueden estar en
Room, pero deben quedar asociados a la instalación/licencia correcta si el
producto evoluciona a múltiples cuentas en el mismo dispositivo.

## Integración MikroTik RouterOS v7

Implementa un cliente con:

- Base URL `http://<ip>/rest`.
- Basic Auth construido en memoria.
- `Content-Type: application/json`.
- Timeout aproximado de 6 segundos para prueba de conexión y de 8–12
  segundos para operaciones de escritura.
- Mensajes para `401`, `404`, timeout, JSON inválido y otros códigos.
- Red en coroutines.

### Probar conexión

Ejecuta:

```text
GET /rest/ip/hotspot
```

Interpreta 200 como éxito, 401 como credenciales incorrectas, 404 como
IP/ruta incorrecta y timeout como router inaccesible o teléfono fuera de la
red.

### Perfil de velocidad

Para un plan, calcula:

```text
rate-limit = "<downloadMbps>M/<uploadMbps>M"
```

Ejecuta:

```text
GET /rest/ip/hotspot/user/profile
```

Si el perfil existe y el rate limit cambió:

```text
PATCH /rest/ip/hotspot/user/profile/<routeros-id>
{
  "rate-limit": "10M/2M"
}
```

Si no existe:

```text
PUT /rest/ip/hotspot/user/profile
{
  "name": "app-plan-...",
  "rate-limit": "10M/2M"
}
```

Usa un nombre de perfil estable derivado del `planId`, no uno diferente en
cada generación.

### Crear ticket

Genera:

- usuario: `h` + seis caracteres minúsculos alfanuméricos;
- clave: seis caracteres sin caracteres ambiguos;
- horas: `01:00:00`, `12:00:00`, etc.;
- días: `1d 00:00:00`, `7d 00:00:00`, etc.

Luego ejecuta:

```text
PUT /rest/ip/hotspot/user
{
  "name": "habc123",
  "password": "k7m4pq",
  "profile": "app-plan-...",
  "limit-uptime": "04:00:00"
}
```

Guarda el ticket local únicamente si RouterOS responde correctamente.
Conserva el `.id` de la respuesta.

### Eliminar ticket

Si existe `mikrotikUserId`:

```text
DELETE /rest/ip/hotspot/user/<id>
```

Si no existe, lista usuarios y localiza por nombre. Un 404 durante el borrado
es éxito lógico porque el usuario ya no existe.

### Portal hotspot

Permite editar nombre del negocio y color. Genera HTML seguro y ASCII-safe,
con escape de valores introducidos por el usuario. Después:

1. `GET /rest/file`.
2. Buscar `flash/hotspot/login.html` o `hotspot/login.html`.
3. Codificar `contents` en Base64.
4. Usar `PATCH` si el archivo existe.
5. Usar `PUT` con nombre `flash/hotspot/login.html` si no existe.

No codifiques incorrectamente el asterisco de un ID RouterOS como `*6` al
formar la URL.

## Pantallas y navegación

Usa una navegación inferior:

1. **Panel**
   - resumen de licencia;
   - tickets de hoy;
   - tickets activos;
   - selector de plan;
   - botón “Generar ticket”.
2. **Planes**
   - listar, crear, editar y eliminar planes;
   - mostrar sincronización con MikroTik.
3. **Historial**
   - activos/vencidos;
   - detalle;
   - reimpresión;
   - compartir;
   - eliminar usuario;
   - limpiar vencidos.
4. **Ajustes**
   - conexión MikroTik;
   - prueba de conexión;
   - impresora Bluetooth;
   - portal hotspot;
   - datos de licencia;
   - cerrar sesión;
   - versión de la app.

Incluye pantalla de carga inicial y `ErrorBoundary`/pantalla de error para
fallos no controlados. Los formularios deben funcionar con teclado visible.

## Impresión y compartir

Genera un ticket de 58 mm con:

```text
INTERNET HOTSPOT
----------------
USUARIO: abc
CLAVE:   xyz
----------------
Plan:
Duración:
Precio:
----------------
Inicio:
Expira:
----------------
Red WiFi:
Gracias por su preferencia
```

Implementa:

1. texto compartible por Android Sharesheet;
2. impresión del sistema cuando el dispositivo lo soporte;
3. impresión Bluetooth Classic directa.

Para Bluetooth Classic:

- solicitar `BLUETOOTH_SCAN` y `BLUETOOTH_CONNECT` en Android 12+;
- comprobar que el Bluetooth está activo;
- enumerar dispositivos emparejados;
- mostrar nombre y dirección;
- guardar la impresora seleccionada;
- conectar usando RFCOMM/SPP;
- enviar comandos ESC/POS crudos;
- usar inicialización, centrado, negrita/tamaño doble para usuario y clave,
  saltos de línea y corte si la impresora lo admite;
- cerrar la conexión de forma segura;
- mostrar errores de permiso, conexión, desconexión y envío.

La impresión directa debe funcionar en el APK compilado con Gradle, no solo
en un entorno de desarrollo.

## Diseño

Usa:

- fondo casi negro;
- tarjetas oscuras;
- rojo PASSNET para botones y énfasis;
- verde para conectado/exitoso;
- amarillo para advertencias;
- rojo claro para errores;
- iconos Material;
- textos en español;
- logo PNG limpio si está disponible.

Incluye accesibilidad, contraste suficiente, `contentDescription`, áreas
táctiles cómodas y estados de foco.

## Pruebas obligatorias

Escribe tests para:

- normalización de correo;
- cálculo de `limit-uptime`;
- cálculo de `rate-limit`;
- expiración visual de tickets;
- generación de usuario y contraseña;
- serialización de Plan y Ticket;
- interpretación de 200/401/404/timeout de MikroTik;
- no borrar token ante error de red;
- tratar 404 de borrado como éxito;
- creación/actualización de perfil;
- construcción de bytes ESC/POS.

Si no hay un MikroTik disponible, agrega un fake de repositorio solo para
tests, nunca como fallback silencioso en producción.

## Entrega final

Antes de terminar:

1. Ejecuta `./gradlew :app:test`.
2. Ejecuta `./gradlew :app:lint`.
3. Ejecuta `./gradlew :app:assembleDebug`.
4. Instala el APK en un Android real o emulador.
5. Verifica navegación, login, Room, permisos, Bluetooth y errores de red.
6. Documenta en `README.md` cómo configurar `local.properties`, compilar el
   APK, generar el AAB y configurar la firma.
7. Indica claramente qué requiere un API central operativo y qué requiere un
   MikroTik real.

No declares la aplicación completa si solo compila la UI con mocks. La
aceptación requiere que estén conectados los flujos reales de licencia,
RouterOS, almacenamiento e impresión.