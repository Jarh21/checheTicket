import { Router, type IRouter } from "express";
import {
  getLicenseSessionController,
  loginLicenseController,
  logoutLicenseController,
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

export default router;