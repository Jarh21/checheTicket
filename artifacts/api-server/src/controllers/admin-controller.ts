import type { Request, Response } from "express";
import {
  CreateLicenseBody,
  CreateLicenseResponse,
  GetAdminDashboardResponse,
  ListLicenseDevicesParams,
  ListLicenseDevicesResponse,
  ListLicensesResponse,
  LoginAdminBody,
  LoginAdminResponse,
  RenewLicenseBody,
  RenewLicenseParams,
  RenewLicenseResponse,
  UpdateLicenseBody,
  UpdateLicenseParams,
  UpdateLicenseResponse,
} from "@workspace/api-zod";
import {
  authenticateAdmin,
  createLicense,
  ensureAdminUser,
  getDashboard,
  listDevices,
  listPublicLicenses,
  renewLicense,
  updateLicense,
} from "../services/license-service";
import {
  createSession,
  revokeSession,
} from "../lib/session-service";
import { getAuthToken as getMiddlewareAuthToken } from "../middlewares/auth";

export async function loginAdminController(
  request: Request,
  response: Response,
): Promise<void> {
  const parsed = LoginAdminBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);
  const token = await createSession("admin", null);
  response.json(LoginAdminResponse.parse({ token, email: admin.email }));
}

export async function logoutAdminController(
  _request: Request,
  response: Response,
): Promise<void> {
  await revokeSession(getMiddlewareAuthToken(response));
  response.status(204).send();
}

export async function getAdminDashboardController(
  _request: Request,
  response: Response,
): Promise<void> {
  response.json(GetAdminDashboardResponse.parse(await getDashboard()));
}

export async function listLicensesController(
  _request: Request,
  response: Response,
): Promise<void> {
  response.json(ListLicensesResponse.parse(await listPublicLicenses()));
}

export async function createLicenseController(
  request: Request,
  response: Response,
): Promise<void> {
  const parsed = CreateLicenseBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }
  const license = await createLicense(parsed.data);
  response.status(201).json(CreateLicenseResponse.parse(license));
}

export async function updateLicenseController(
  request: Request,
  response: Response,
): Promise<void> {
  const params = UpdateLicenseParams.safeParse(request.params);
  const body = UpdateLicenseBody.safeParse(request.body);
  if (!params.success) {
    response.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    response.status(400).json({ error: body.error.message });
    return;
  }
  const license = await updateLicense(params.data.licenseId, body.data);
  response.json(UpdateLicenseResponse.parse(license));
}

export async function renewLicenseController(
  request: Request,
  response: Response,
): Promise<void> {
  const params = RenewLicenseParams.safeParse(request.params);
  const body = RenewLicenseBody.safeParse(request.body);
  if (!params.success) {
    response.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    response.status(400).json({ error: body.error.message });
    return;
  }
  const license = await renewLicense(
    params.data.licenseId,
    body.data.durationDays,
  );
  response.json(RenewLicenseResponse.parse(license));
}

export async function listLicenseDevicesController(
  request: Request,
  response: Response,
): Promise<void> {
  const params = ListLicenseDevicesParams.safeParse(request.params);
  if (!params.success) {
    response.status(400).json({ error: params.error.message });
    return;
  }
  response.json(
    ListLicenseDevicesResponse.parse(await listDevices(params.data.licenseId)),
  );
}

export async function ensureAdminController(): Promise<void> {
  await ensureAdminUser();
}