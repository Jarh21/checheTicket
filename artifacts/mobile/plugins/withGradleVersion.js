const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Pins the Gradle distribution version and sets a longer network timeout.
 * expo-build-properties@57 was overriding the Expo SDK 54 default (8.10.2)
 * to 8.14.3, causing EAS build failures. This plugin ensures 8.10.2 is used.
 */
const withGradleVersion = (config, { gradleVersion = '8.10.2' } = {}) => {
  return withDangerousMod(config, [
    'android',
    (c) => {
      const wrapperDir = path.join(
        c.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
      );
      fs.mkdirSync(wrapperDir, { recursive: true });

      const content = [
        'distributionBase=GRADLE_USER_HOME',
        'distributionPath=wrapper/dists',
        `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`,
        'networkTimeout=60000',
        'validateDistributionUrl=true',
        'zipStoreBase=GRADLE_USER_HOME',
        'zipStorePath=wrapper/dists',
      ].join('\n') + '\n';

      const wrapperPropsPath = path.join(wrapperDir, 'gradle-wrapper.properties');
      fs.writeFileSync(wrapperPropsPath, content, 'utf8');
      console.log(`[withGradleVersion] Gradle pinned to ${gradleVersion} (timeout 60s)`);
      return c;
    },
  ]);
};

module.exports = withGradleVersion;
