---
name: Central license authority
description: Durable architecture decisions for customer licensing and mobile access.
---

The mobile app must treat the central HTTPS API as the authority for access. A local clock, cached license status, or local password must not grant access after a license expires or is suspended. The API owns account status, license status, opaque sessions, and device limits; the mobile app keeps only the session token and device identifier locally.

**Why:** The app is distributed to multiple customers for limited periods, so administrators need to suspend, renew, and reactivate access remotely without trusting the phone.

**How to apply:** Any new mobile entry point or protected operation must restore and periodically revalidate the remote session. Production API startup must require configured administrator credentials rather than relying on development defaults.