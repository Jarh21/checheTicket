---
name: Production publish requirements
description: Deployment constraints learned from the multi-artifact HotSpot Manager publication flow
---

For production publication, the API requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`; without them its startup initialization exits before opening port 8080. The mobile artifact must return HTTP 200 from the health path declared in its production artifact configuration.

**Why:** Replit's multi-artifact Autoscale promotion starts the API and mobile processes together and aborts when one process exits or a configured health probe returns a non-200 response.

**How to apply:** Before asking the user to publish, confirm the production secrets exist and test each artifact's configured startup path locally. Do not expose secret values.