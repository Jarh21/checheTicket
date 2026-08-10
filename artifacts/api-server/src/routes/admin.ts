import { Router, type IRouter } from "express";
import {
  createLicenseController,
  createAdminUserController,
  getAdminDashboardController,
  getEmailConfigController,
  listLicenseDevicesController,
  listDeviceAuthEventsController,
  listAdminUsersController,
  listLicensesController,
  listPasswordChangeLogsController,
  loginAdminController,
  logoutAdminController,
  renewLicenseController,
  saveEmailConfigController,
  updateLicenseController,
} from "../controllers/admin-controller";
import { requireSession } from "../middlewares/auth";

const router: IRouter = Router();
const requireAdmin = requireSession("admin");

router.post("/admin/auth/login", loginAdminController);
router.post("/admin/auth/logout", requireAdmin, logoutAdminController);
router.get("/admin/dashboard", requireAdmin, getAdminDashboardController);
router.get("/admin/licenses", requireAdmin, listLicensesController);
router.post("/admin/licenses", requireAdmin, createLicenseController);
router.patch(
  "/admin/licenses/:licenseId",
  requireAdmin,
  updateLicenseController,
);
router.post(
  "/admin/licenses/:licenseId/renew",
  requireAdmin,
  renewLicenseController,
);
router.get(
  "/admin/licenses/:licenseId/devices",
  requireAdmin,
  listLicenseDevicesController,
);
router.get("/admin/device-auth-events", requireAdmin, listDeviceAuthEventsController);
router.get("/admin/users", requireAdmin, listAdminUsersController);
router.post("/admin/users", requireAdmin, createAdminUserController);

// Email config
router.get("/admin/email-config", requireAdmin, getEmailConfigController);
router.put("/admin/email-config", requireAdmin, saveEmailConfigController);

// Audit logs
router.get("/admin/password-change-logs", requireAdmin, listPasswordChangeLogsController);

export default router;
