---
name: MikroTik REST direct
description: Compatibilidad y convenciones para el cliente REST directo de RouterOS.
---

En RouterOS v7, algunas versiones responden `400 unknown parameter rate-limit` al
enviar ese campo mediante REST, incluso al intentar crear un perfil. El flujo
compatible de emergencia crea el usuario con el perfil existente `default` y
`limit-uptime`, sin escribir `rate-limit`.

**Why:** La documentación de CLI expone `rate-limit` en el submenú de perfiles, y
un router v7 real rechazó el atributo durante el flujo REST de creación.

**How to apply:** Reutilizar perfiles determinísticos por velocidad, crear el usuario
con `profile` y `limit-uptime`, y si el router rechaza perfiles, usar `default` sin
enviar `rate-limit` en ninguna solicitud REST.

Los usuarios HotSpot no se eliminan automáticamente cuando `limit-uptime` llega a
cero: RouterOS conserva la entrada y solo bloquea su uso. La aplicación debe enviar
un `DELETE` explícito para retirarla del router.

**Why:** El vencimiento local y el límite de tiempo del router controlan el acceso,
pero ninguno de los dos borra por sí mismo la cuenta HotSpot.

**How to apply:** Las acciones de eliminar un ticket y limpiar vencidos deben borrar
primero el usuario remoto; si MikroTik falla, conservar el ticket local para reintentar.