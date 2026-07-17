import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendCreated } from "../../../common/helpers";
import { AuthService } from "../application/auth.service";
import { LocalLoginDto, GoogleLoginDto, LocalSignupDto } from "./auth.validation";
import { env } from "../../../config";
import { ForbiddenException } from "../../../common/exceptions";
import { Messages } from "../../../common/constants";
import { logger } from "../../../config/logger.config";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, refreshToken: string) {
    const isProd = env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProd = env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
    });
  }

  localLogin = asyncHandler(
    async (req: Request<{}, {}, LocalLoginDto>, res: Response) => {
      const body = req.body;
      const ip = req.ip;
      const { accessToken, refreshToken } = await this.authService.localLogin(
        body,
        ip
      );

      this.setRefreshCookie(res, refreshToken);
      sendSuccess(res, Messages.AUTH.LOGIN_SUCCESS, { accessToken });
    }
  );

  localSignup = asyncHandler(
    async (req: Request<{}, {}, LocalSignupDto>, res: Response) => {
      const body = req.body;
      const ip = req.ip;
      const { accessToken, refreshToken } = await this.authService.localSignup(
        body,
        ip
      );

      this.setRefreshCookie(res, refreshToken);
      sendCreated(res, Messages.AUTH.SIGNUP_SUCCESS, { accessToken });
    }
  );

  googleLogin = asyncHandler(
    async (req: Request<{}, {}, GoogleLoginDto>, res: Response) => {
      const { code } = req.body;
      const ip = req.ip;
      const { accessToken, refreshToken } = await this.authService.googleLogin(
        code,
        ip
      );

      this.setRefreshCookie(res, refreshToken);
      sendSuccess(res, Messages.AUTH.GOOGLE_LOGIN_SUCCESS, { accessToken });
    }
  );

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ForbiddenException(Messages.AUTH.SESSION_EXPIRED);
    }

    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshToken(refreshToken);

      this.setRefreshCookie(res, newRefreshToken);
      sendSuccess(res, Messages.AUTH.TOKEN_REFRESHED, { accessToken: newAccessToken });
    } catch (error) {
      logger.error("Token refresh failed", { error });
      this.clearRefreshCookie(res);
      throw new ForbiddenException(Messages.AUTH.REFRESH_TOKEN_EXPIRED);
    }
  });

  me = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenException(Messages.UNAUTHORIZED);
    }

    const user = await this.authService.getMe(userId);
    sendSuccess(res, Messages.USER.FETCHED, user);
  });

  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ForbiddenException(Messages.AUTH.SESSION_EXPIRED);
    }

    try {
      await this.authService.logOut(refreshToken);
      this.clearRefreshCookie(res);
      sendSuccess(res, Messages.AUTH.LOGOUT_SUCCESS, {});
    } catch (error) {
      logger.error("Logout failed", { error });
      this.clearRefreshCookie(res);
      throw new ForbiddenException(Messages.AUTH.REFRESH_TOKEN_EXPIRED);
    }
  });
}
