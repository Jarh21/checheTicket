---
name: MikroTik REST direct
description: Compatibilidad y convenciones para el cliente REST directo de RouterOS.
---

En RouterOS v7, el límite de velocidad para usuarios de HotSpot debe configurarse en
`/ip/hotspot/user/profile` y luego asignarse al usuario mediante `profile`. Algunas
versiones responden `400 unknown parameter rate-limit` si se envía `rate-limit`
directamente al crear un registro en `/ip/hotspot/user`.

**Why:** La documentación de CLI expone `rate-limit` en el submenú de perfiles, y
un router v7 real rechazó el atributo en la creación directa del usuario.

**How to apply:** Reutilizar perfiles determinísticos por velocidad, crear el usuario
con `profile` y `limit-uptime`, y no enviar `rate-limit` en el cuerpo de `/ip/hotspot/user`.