---
name: passnet-wifi-kotlin
description: Crea o migra PASSNET WIFI a una app Android nativa en Kotlin y Jetpack Compose, compilada con Gradle para APK/AAB, manteniendo licencias, MikroTik RouterOS v7, tickets y Bluetooth ESC/POS. Usar cuando se solicite rehacer esta app móvil sin Expo/EAS.
---

# PASSNET WIFI — Android nativo

Este skill define cómo construir una versión Android nativa de PASSNET WIFI
sin Expo, React Native ni EAS. La implementación objetivo es **Kotlin +
Jetpack Compose + Gradle**, con un APK instalable y un AAB publicable.

## Decisión técnica obligatoria

- Lenguaje: Kotlin.
- UI: Jetpack Compose y Material 3.
- Arquitectura: MVVM/Clean ligera, `ViewModel`, `StateFlow`, repositorios y
  casos de uso cuando aporten claridad.
- Red: OkHttp/Retrofit para la API central y OkHttp directo para MikroTik.
- Persistencia: Room para planes y tickets; `DataStore` o
  `EncryptedSharedPreferences` para configuración y tokens.
- Secretos locales: Android Keystore mediante AndroidX Security Crypto.
- Inyección: Hilt o una composición manual sencilla; no introducir una
  plataforma innecesaria.
- Concurrencia: Kotlin Coroutines.
- Fechas: `java.time` y zona local; no usar la hora local para decidir la
  validez de una licencia.
- Compilación: Gradle Wrapper, Java 17, variante `debug` para pruebas y
  `release` para distribución.
- Plataforma inicial: Android solamente, `minSdk` 26 o superior.
- Idioma visible: español. Tema: oscuro, tecnológico, con rojo como color
  primario.

## Resultado esperado

Entregar un proyecto Android completo que:

1. Abra y compile con `./gradlew`.
2. Produzca `app-debug.apk` sin servicios externos.
3. Produzca `app-release.aab` cuando se configure el keystore.
4. Se conecte al API central por HTTPS.
5. Se conecte directamente al MikroTik dentro de la red local.
6. Imprima tickets en una impresora Bluetooth Classic de 58 mm usando ESC/POS.
7. Mantenga el flujo y los datos esenciales de la app existente.

No sustituir el API central por datos simulados. Si el API no está disponible,
mostrar el error de red de forma explícita.

## Funcionalidad que debe conservarse

### 1. Autenticación y licencia

Pantallas:

- Inicio de sesión con correo y contraseña.
- Recuperar contraseña.
- Restablecer contraseña desde un token recibido por deep link.
- Restaurar sesión al abrir la app.
- Cerrar sesión.
- Inicio de sesión biométrico opcional después de un login válido.

Reglas:

- Normalizar el correo con `trim().lowercase()`.
- Crear y guardar un identificador estable por instalación/dispositivo.
- Enviar al login: `email`, `password`, `deviceId` y `deviceName`.
- Guardar el token de sesión protegido localmente.
- El token solo se elimina ante rechazo explícito de autenticación
  (`401`/`403`); un error de red no debe borrar la sesión guardada.
- La licencia es autoritativa en el servidor: estado, expiración y límite de
  dispositivos no se calculan con el reloj local.
- No imprimir tokens, contraseñas ni credenciales en logs.

Rutas mínimas del API central:

- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

La URL base debe ser configurable por `BuildConfig` o `local.properties`, y
debe existir una configuración segura para desarrollo y producción.

### 2. Panel principal

Mostrar:

- Nombre/correo de la cuenta y estado de la licencia.
- Cantidad de tickets de hoy.
- Cantidad de tickets activos.
- Selector de plan.
- Formulario o acción principal “Generar ticket”.
- Estado de conexión/configuración del MikroTik.

Si el MikroTik no está configurado, deshabilitar la generación y explicar que
debe configurarse en Ajustes.

### 3. Planes

CRUD local de planes con:

- `id`
- `name`
- tipo: `hours` o `days`
- `duration`
- `price`
- `uploadSpeed` en Mbps
- `downloadSpeed` en Mbps
- nombre opcional del perfil MikroTik
- estado de sincronización del perfil

Al guardar o usar un plan, sincronizar el perfil de velocidad en MikroTik:

- Leer `GET /rest/ip/hotspot/user/profile`.
- Si existe el perfil, actualizar `rate-limit` cuando cambie.
- Si no existe, crearlo con `PUT`.
- Formato de velocidad: `downloadMbpsM/uploadMbpsM`.

### 4. Generación de tickets

Al generar un ticket:

1. Validar plan, precio, configuración y conectividad.
2. Generar usuario aleatorio con prefijo `h`, seis caracteres
   alfanuméricos en minúscula.
3. Generar contraseña aleatoria de seis caracteres, evitando caracteres
   ambiguos como `l`, `o`, `0` y `1`.
4. Convertir duración:
   - horas: `HH:00:00`, con dos dígitos;
   - días: `Nd 00:00:00`.
5. Asegurar el perfil del plan en MikroTik.
6. Crear el usuario con `PUT /rest/ip/hotspot/user` y enviar:
   `name`, `password`, `profile`, `limit-uptime`.
7. Guardar localmente el ticket solo después de recibir una respuesta exitosa.
8. Guardar el `.id` de RouterOS si está presente.
9. Mostrar un modal con usuario, clave, plan, duración, precio, inicio y
   vencimiento.
10. Ofrecer compartir, imprimir por sistema y imprimir por Bluetooth.

El modelo local del ticket debe incluir:

`id`, `username`, `password`, `planId`, `planName`, `durationLabel`, `price`,
`limitUptime`, `rateLimit`, `createdAt`, `expiresAt`, `mikrotikUserId`.

Evitar duplicados si el usuario pulsa dos veces. Usar estado de carga y una
operación idempotente o una protección de UI.

### 5. Historial

Mostrar tickets activos y vencidos, ordenados por fecha descendente.

Acciones:

- Ver detalle.
- Compartir ticket.
- Reimprimir.
- Eliminar el usuario correspondiente de MikroTik.
- Limpiar tickets vencidos.

Para borrar:

- Usar el `.id` de RouterOS si existe.
- Para tickets antiguos sin `.id`, listar usuarios y buscar por `name`.
- Un `404` al borrar significa que el estado deseado ya se logró y debe
  tratarse como éxito.
- No borrar el registro local si MikroTik reporta un error real, salvo que el
  usuario confirme una eliminación local separada.

### 6. Ajustes de MikroTik

Formulario para:

- IP o hostname del router.
- Usuario.
- Contraseña.
- Servidor hotspot.
- Nombre de la red WiFi.

Guardar las credenciales cifradas. No usar logs de red que incluyan el header
`Authorization`.

Conexión directa:

- Base URL: `http://<ip>/rest`.
- Autenticación HTTP Basic.
- Timeout de lectura/conexión alrededor de 6–12 segundos.
- Mensajes claros para timeout, `401`, `404` y otros errores HTTP.
- Mostrar una advertencia de que HTTP sin TLS solo debe usarse en la red local
  de confianza; permitir HTTPS si el router está configurado para ello.

La prueba de conexión debe ejecutar `GET /rest/ip/hotspot` y diferenciar:

- éxito;
- credenciales incorrectas;
- ruta/IP incorrecta;
- tiempo agotado;
- error HTTP genérico.

### 7. Portal hotspot personalizado

Incluir un editor básico con nombre del negocio, color y vista previa del HTML
de login. Subir directamente al router:

1. `GET /rest/file`.
2. Buscar `flash/hotspot/login.html` o `hotspot/login.html`.
3. Convertir el HTML a Base64.
4. Actualizar el archivo existente con `PATCH /rest/file/<id>` o crearlo con
   `PUT /rest/file`.
5. Reportar el resultado al usuario.

Respetar el detalle de RouterOS: al construir la URL del `.id`, no codificar
incorrectamente el asterisco de IDs como `*6`.

### 8. Impresión

Implementar tres salidas:

1. Compartir texto usando el Android Sharesheet.
2. Imprimir usando el sistema Android/Print Framework, si está disponible.
3. Impresión directa Bluetooth Classic ESC/POS.

Para Bluetooth:

- Trabajar con impresoras emparejadas, no hacer escaneo innecesario.
- Solicitar en tiempo de ejecución `BLUETOOTH_SCAN` y
  `BLUETOOTH_CONNECT` en Android 12+.
- Comprobar Bluetooth encendido.
- Mostrar lista de dispositivos emparejados con nombre y MAC.
- Permitir seleccionar y recordar una impresora.
- Conectar antes de imprimir.
- Enviar bytes ESC/POS crudos por RFCOMM/SPP.
- Formato de 58 mm: texto centrado, usuario y clave grandes, separadores,
  plan, duración, precio, inicio, expiración, WiFi y despedida.
- Manejar desconexión, permisos denegados, impresora apagada y papel agotado
  con mensajes visibles.
- No fingir impresión exitosa si no se confirmaron los bytes enviados.

No depender de Expo Go ni de módulos nativos opcionales: en esta versión la
impresión Bluetooth es parte real del APK Android.

## Navegación y UI

Usar una navegación inferior con:

- Panel
- Planes
- Historial
- Ajustes

Usar Material 3 con:

- fondo oscuro;
- tarjetas con bordes suaves;
- rojo PASSNET para acciones principales;
- estados de éxito, advertencia y error claramente diferenciados;
- tipografía legible;
- soporte para teclado, tamaños de fuente accesibles y TalkBack;
- estados de carga, vacío, error y éxito para cada operación de red.

Incluir el logo PNG limpio existente o pedir un asset equivalente si el nuevo
proyecto no comparte archivos. No redibujar el logo con texto si existe el PNG.

## Seguridad y confiabilidad

- Nunca guardar la contraseña de MikroTik en texto plano.
- Nunca enviar credenciales a un backend intermedio: la llamada al router es
  directa desde el móvil, como en la app original.
- Validar y escapar contenido del portal HTML.
- Evitar inyección HTML en tickets, portal y nombres de planes.
- Usar HTTPS para el API central.
- No confiar en expiración local para licencias.
- Separar errores de red, autenticación, validación y RouterOS.
- Cancelar coroutines al destruir pantallas.
- No bloquear el hilo principal con red, Room o Bluetooth.
- Añadir tests unitarios para duración, velocidad, fechas, generación de
  credenciales, serialización y manejo de respuestas HTTP.

## Estructura sugerida

```text
app/
  src/main/java/com/passnet/wifi/
    App.kt
    MainActivity.kt
    navigation/
    ui/theme/
    ui/auth/
    ui/dashboard/
    ui/plans/
    ui/history/
    ui/settings/
    data/local/
    data/remote/license/
    data/remote/mikrotik/
    data/printer/
    domain/model/
    domain/repository/
    domain/usecase/
  src/main/res/
  build.gradle.kts
build.gradle.kts
settings.gradle.kts
gradle/libs.versions.toml
gradlew
```

No crear una segunda API para ocultar MikroTik. La API central sigue siendo
para licencia, sesión, cuentas y dispositivos; el router sigue siendo una
dependencia local configurable.

## Compilación y verificación

Comandos mínimos:

```bash
./gradlew :app:assembleDebug
./gradlew :app:test
./gradlew :app:lint
./gradlew :app:bundleRelease
```

El prompt generador debe pedir que se verifique:

- instalación del APK en un Android real;
- login online y restauración de sesión;
- bloqueo por licencia inválida o dispositivo excedido;
- prueba de MikroTik RouterOS v7;
- generación, persistencia y eliminación de ticket;
- permisos y conexión de impresora Bluetooth;
- salida ESC/POS en rollo de 58 mm;
- modo sin red sin borrar la sesión;
- deep link de recuperación de contraseña;
- compilación limpia desde `./gradlew`.

## Prompt listo para usar

El prompt completo y autocontenido está en
`references/passnet-wifi-native-prompt.md`. Usarlo como especificación inicial
para otro agente o proyecto; sustituir únicamente las variables marcadas con
`[CONFIGURAR]`.
