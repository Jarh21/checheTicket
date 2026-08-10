import { Router, type IRouter } from "express";
import {
  forgotPasswordController,
  getLicenseSessionController,
  loginLicenseController,
  logoutLicenseController,
  resetPasswordController,
} from "../controllers/auth-controller";
import { requireSession } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", loginLicenseController);
router.get(
  "/auth/me",
  requireSession("license"),
  getLicenseSessionController,
);
router.post(
  "/auth/logout",
  requireSession("license"),
  logoutLicenseController,
);

// Password reset (no auth required)
router.post("/auth/forgot-password", forgotPasswordController);
router.post("/auth/reset-password", resetPasswordController);

export default router;
