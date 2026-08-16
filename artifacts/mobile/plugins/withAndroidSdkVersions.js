const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Pins Android SDK versions in the root build.gradle so that any native
 * library that uses the safeExtGet() helper (e.g. rn-bluetooth-classic-printer)
 * reads these values instead of falling back to its own defaults.
 *
 * Background: rn-bluetooth-classic-printer defaults to compileSdkVersion=36 /
 * targetSdkVersion=36 (Android 16). The EAS build image for Expo SDK 54 only
 * has Android SDK 35 pre-installed, which causes an unknown Gradle error.
 * Setting these values at the root project level overrides the library default.
 */
const withAndroidSdkVersions = (
  config,
  { compileSdkVersion = 35, targetSdkVersion = 35, minSdkVersion = 24 } = {},
) => {
  return withDangerousMod(config, [
    'android',
    (c) => {
      const buildGradlePath = path.join(
        c.modRequest.platformProjectRoot,
        'build.gradle',
      );

      if (!fs.existsSync(buildGradlePath)) {
        console.warn('[withAndroidSdkVersions] android/build.gradle not found, skipping');
        return c;
      }

      let content = fs.readFileSync(buildGradlePath, 'utf8');

      const extBlock = `
// ─── SDK version overrides ────────────────────────────────────────────────────
// These let third-party modules that use safeExtGet() (like rn-bluetooth-classic-printer)
// pick up the correct SDK versions rather than defaulting to SDK 36.
ext {
    compileSdkVersion = ${compileSdkVersion}
    targetSdkVersion  = ${targetSdkVersion}
    minSdkVersion     = ${minSdkVersion}
}
// ─────────────────────────────────────────────────────────────────────────────
`;

      // Avoid inserting the block twice on repeated prebuild runs
      if (content.includes('SDK version overrides')) {
        console.log('[withAndroidSdkVersions] ext block already present, skipping');
        return c;
      }

      // Insert the ext block at the top of the file, before any existing content
      content = extBlock + content;
      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log(
        `[withAndroidSdkVersions] pinned compileSdk=${compileSdkVersion} targetSdk=${targetSdkVersion} minSdk=${minSdkVersion}`,
      );
      return c;
    },
  ]);
};

module.exports = withAndroidSdkVersions;
