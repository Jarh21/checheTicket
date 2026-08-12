const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin that ensures HTTP (cleartext) traffic is allowed.
 * Expo SDK 50+ may generate a network_security_config.xml that blocks HTTP
 * even when android:usesCleartextTraffic="true" is set. We:
 *  1. Set usesCleartextTraffic="true" on <application>
 *  2. Write a permissive network_security_config.xml
 *  3. Point android:networkSecurityConfig at it in the manifest
 */
const withCleartextTraffic = (config) => {
  // Step 1 & 3: patch AndroidManifest.xml
  config = withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.$['android:usesCleartextTraffic'] = 'true';
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return c;
  });

  // Step 2: write the XML file
  config = withDangerousMod(config, [
    'android',
    (c) => {
      const xmlDir = path.join(
        c.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });

      const xmlPath = path.join(xmlDir, 'network_security_config.xml');
      fs.writeFileSync(
        xmlPath,
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`,
      );
      return c;
    },
  ]);

  return config;
};

module.exports = withCleartextTraffic;
