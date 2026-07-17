import { Router, type Router as ExpressRouter } from "express";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { validate, auth, authLimiter } from "../../../common/middleware";
import { JwtService } from "../infrastructure/jwt.service";

export const createAuthRoutes = (
  controller: AuthController,
  jwtService: JwtService
): ExpressRouter => {
  const router = Router();

  router.post(
    "/local-login",
    authLimiter,
    validate(authValidation.localLogin),
    controller.localLogin
  );

  router.post(
    "/local-signup",
    authLimiter,
    validate(authValidation.localSignup),
    controller.localSignup
  );

  router.post(
    "/google-login",
    authLimiter,
    validate(authValidation.googleLogin),
    controller.googleLogin
  );

  router.post("/refresh", controller.refresh);
  router.get("/me", auth(jwtService), controller.me);
  router.post("/logout", auth(jwtService), controller.logout);

  return router;
};
