---
name: Native Kotlin variant
description: Architectural target for rebuilding PASSNET WIFI outside Expo/EAS.
---

The alternative mobile implementation target is Android native with Kotlin,
Jetpack Compose, Coroutines, Room/DataStore, Android Keystore, and Gradle
Wrapper. It should produce APK/AAB artifacts directly and preserve direct
MikroTik RouterOS REST access plus Bluetooth Classic ESC/POS printing.

**Why:** The original Expo/EAS build path is separate from the desired
alternative, while Android native provides first-class access to Bluetooth,
local networking, permissions, and Gradle-based packaging.

**How to apply:** When generating or migrating this mobile app without
Expo/EAS, use the `passnet-wifi-kotlin` skill and its native prompt as the
baseline instead of designing a generic cross-platform app.