const getBase = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo enviar el correo');
  }
}

export async function confirmPasswordReset(
  token: string,
  password: string,
  deviceId?: string,
  deviceName?: string,
): Promise<void> {
  const res = await fetch(`${getBase()}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password, deviceId, deviceName }),
  });
  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo restablecer la contraseña');
  }
}
