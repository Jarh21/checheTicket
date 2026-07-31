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
  getLicenseSession,
} from "../services/license-service";
import { createSession, revokeSession } from "../lib/session-service";

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