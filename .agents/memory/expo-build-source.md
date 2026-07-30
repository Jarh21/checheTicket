---
name: Expo build source
description: How to recognize and avoid compiling the wrong monorepo snapshot in Expo/EAS.
---

For this monorepo, the mobile package is under `artifacts/mobile` and the workspace root controls pnpm installation. The Expo build source must be the current repository root and branch containing that package.

**Why:** A remote build log showing a different Expo major version or a different root dependency set means the build service is using a stale commit, wrong branch, or different repository; changing local Node/npm versions will not fix it.

**How to apply:** Before retrying a build, push the current workspace changes, select the matching repository/branch in Expo, verify the build source contains `artifacts/mobile/package.json`, `pnpm-workspace.yaml`, and the root `package.json`, then clear the remote build cache if available.