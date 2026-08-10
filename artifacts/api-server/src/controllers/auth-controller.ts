import type { Request, Response } from "express";
import {
  GetLicenseSessionResponse,
  LoginLicenseBody,
  LoginLicenseResponse,
} from "@workspace/api-zod";
import { AppError } from "../lib/errors";
import { getAuthContext, getAuthToken } from "../middlewares/auth";
import {
  authenticateLicense,
  createPasswordResetToken,
  confirmPasswordReset,
  getLicenseSession,
  getEmailConfigFull,
} from "../services/license-service";
import { createSession, revokeSession } from "../lib/session-service";
import { sendPasswordResetEmail } from "../lib/email-service";

export async function loginLicenseController(
  request: Request,
  response: Response,
): Promise<void> {
  const parsed = LoginLicenseBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }

  const session = await authenticateLicense(parsed.data);
  const token = await createSession("license", session.account.id);
  response.json(LoginLicenseResponse.parse({ token, session }));
}

export async function getLicenseSessionController(
  _request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthContext(response);
  if (!auth.accountId) {
    throw new AppError(401, "La sesión no tiene una cuenta asociada");
  }
  const session = await getLicenseSession(auth.accountId);
  response.json(GetLicenseSessionResponse.parse(session));
}

export async function logoutLicenseController(
  _request: Request,
  response: Response,
): Promise<void> {
  await revokeSession(getAuthToken(response));
  response.status(204).send();
}

export async function forgotPasswordController(
  request: Request,
  response: Response,
): Promise<void> {
  const email = String(request.body?.email ?? "").trim();
  if (!email || !email.includes("@")) {
    response.status(400).json({ error: "Ingresa un correo válido" });
    return;
  }

  const emailConfig = await getEmailConfigFull();
  if (!emailConfig) {
    response.status(503).json({
      error: "El sistema de correo no está configurado. Contacta al administrador.",
    });
    return;
  }

  const token = await createPasswordResetToken(email);
  if (token) {
    // Don't await — avoid timing attacks that reveal if email exists
    sendPasswordResetEmail(email, token, emailConfig).catch((err: unknown) => {
      console.error("[email] Failed to send reset email:", err);
    });
  }

  // Always return success to avoid revealing whether the email exists
  response.json({
    message:
      "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  });
}

export async function resetPasswordController(
  request: Request,
  response: Response,
): Promise<void> {
  const { token, password, deviceId, deviceName } = (request.body ?? {}) as {
    token?: string;
    password?: string;
    deviceId?: string;
    deviceName?: string;
  };

  if (!token || !password) {
    response
      .status(400)
      .json({ error: "Token y contraseña son requeridos" });
    return;
  }
  if (password.length < 6) {
    response
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }

  await confirmPasswordReset({
    token,
    password,
    deviceId,
    deviceName,
    ipAddress: request.ip,
  });

  response.json({ message: "Contraseña actualizada correctamente" });
}
