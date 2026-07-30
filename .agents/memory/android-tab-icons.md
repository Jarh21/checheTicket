---
name: Android tab icons
description: Icon compatibility decision for the mobile app's current Android target.
---

The current mobile release targets Android and Expo Go. Its tab bar should use the classic Expo Router tabs with bundled vector icon fonts, not iOS SF Symbols or NativeTabs.

**Why:** NativeTabs and SF Symbols can produce blank tab icons when the app is run on Android through Expo Go.

**How to apply:** Keep the Android tab layout on MaterialCommunityIcons and verify a fresh Expo Go reload after navigation changes.