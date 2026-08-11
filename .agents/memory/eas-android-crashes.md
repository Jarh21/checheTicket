---
name: EAS Android crash checklist
description: Three crash patterns seen in EAS APK builds for this monorepo and their fixes.
---

## Pattern 1 — App installs but crashes immediately on launch

**Symptom:** `NoClassDefFoundError: expo.modules.kotlin.types.AnyTypeCache` in `adb logcat`.

**Cause:** A dependency version higher than the SDK requires — specifically `expo-local-authentication: ^57.0.2` installed when Expo SDK 54 / expo-modules-core 3.0.30 is in use. Version 57.x was built against a newer expo-modules-core that added `AnyTypeCache`.

**Fix:** Pin to the SDK-correct version from `node_modules/expo/bundledNativeModules.json`. For SDK 54: `expo-local-authentication: ~17.0.8`.

**Why:** `^` semver ranges can pull future-SDK packages that reference classes not present in the current expo-modules-core. Always use `~` (tilde) or the version from `bundledNativeModules.json`.

## Pattern 2 — Gradle build fails with "Reanimated requires new architecture"

**Symptom:** `assertNewArchitectureEnabledTask FAILED` in the "Run gradlew" phase.

**Cause:** `newArchEnabled: false` in app.json while `react-native-reanimated: ~4.1.x` is a dependency. Reanimated 4 has a hard Gradle assertion that aborts the build if new arch is disabled.

**Fix:** Keep `newArchEnabled: true` in app.json when using Reanimated 4.

**Why:** Reanimated 4 dropped old-arch support. If old arch is needed, downgrade to Reanimated 3.x and remove `react-native-worklets`.

## Pattern 3 — App crashes immediately, caused by babel-plugin-react-compiler

**Symptom:** App closes instantly after splash screen with no useful JS error.

**Cause:** `"reactCompiler": true` in `app.json experiments` + `babel-plugin-react-compiler` in devDependencies generates incorrect bytecode in release builds for certain component patterns.

**Fix:** Remove `reactCompiler` from `app.json experiments`. The babel plugin can stay in devDependencies for local dev but should not activate in production builds without thorough testing.

## How to apply

Before each EAS build, verify:
1. All expo-* dependency versions match `node_modules/expo/bundledNativeModules.json`
2. `newArchEnabled: true` when Reanimated 4.x is in use
3. `reactCompiler` is NOT in `app.json experiments`
