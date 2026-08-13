#!/usr/bin/env node
/**
 * Pre-populates the Gradle wrapper cache so the EAS build worker
 * does not need to download from services.gradle.org (which is
 * unreachable from some EAS build server IP ranges).
 *
 * Runs only when EXPO_IS_EAS_BUILD is set (EAS environment).
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import https from 'https';
import os from 'os';

const GRADLE_VERSION = '8.10.2';
const DIST_NAME = `gradle-${GRADLE_VERSION}-bin`;
const ZIP_NAME = `${DIST_NAME}.zip`;
const DIST_URL = `https://services.gradle.org/distributions/${ZIP_NAME}`;
// Hash = MD5(url) as BigInteger(base-36) — same algorithm as the Gradle wrapper
const URL_HASH = 'a04bxjujx95o3nb99gddekhwo';

// Only run inside EAS builds
if (!process.env.EAS_BUILD && !process.env.CI) {
  console.log('[setup-gradle] Not in EAS — skipping Gradle pre-cache.');
  process.exit(0);
}

const gradleHome = process.env.GRADLE_USER_HOME || join(os.homedir(), '.gradle');
const cacheDir = join(gradleHome, 'wrapper', 'dists', DIST_NAME, URL_HASH);
const zipPath = join(cacheDir, ZIP_NAME);

if (existsSync(zipPath)) {
  console.log(`[setup-gradle] Gradle ${GRADLE_VERSION} already cached at ${zipPath}`);
  process.exit(0);
}

console.log(`[setup-gradle] Downloading Gradle ${GRADLE_VERSION} to ${zipPath} …`);
mkdirSync(cacheDir, { recursive: true });

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total > 0) {
          process.stdout.write(`\r  ${(received / 1e6).toFixed(1)}/${(total / 1e6).toFixed(1)} MB`);
        }
      });
      const out = createWriteStream(dest);
      pipeline(res, out).then(resolve).catch(reject);
    }).on('error', reject);
  });
}

try {
  await download(DIST_URL, zipPath);
  console.log(`\n[setup-gradle] Gradle ${GRADLE_VERSION} cached ✔`);
} catch (err) {
  console.error(`\n[setup-gradle] Warning: could not pre-cache Gradle — ${err.message}`);
  console.error('[setup-gradle] The build will attempt to download it via the wrapper.');
  // Non-fatal: let the build proceed; it may succeed if connectivity improves
}
