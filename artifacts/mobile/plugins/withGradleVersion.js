const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Overwrites gradle-wrapper.properties to pin the Gradle distribution version.
 * Always writes the full file from scratch so regex issues can't interfere.
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
        // Note: backslash before colon is required by the .properties format
        `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`,
        'networkTimeout=10000',
        'validateDistributionUrl=true',
        'zipStoreBase=GRADLE_USER_HOME',
        'zipStorePath=wrapper/dists',
      ].join('\n') + '\n';

      const wrapperPropsPath = path.join(wrapperDir, 'gradle-wrapper.properties');
      fs.writeFileSync(wrapperPropsPath, content, 'utf8');
      console.log(`[withGradleVersion] gradle-wrapper.properties written with Gradle ${gradleVersion}`);
      return c;
    },
  ]);
};

module.exports = withGradleVersion;
