import { OAuth2Client } from "google-auth-library";
import { PrismaService } from "../../../common/database/prisma";
import { HashService } from "../infrastructure/password.service";
import { LocalLoginDto, LocalSignupDto } from "../presentation/auth.validation";
import { NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from "../../../common/exceptions";
import { env } from "../../../config";
import { UserService } from "../../users";
import { Messages } from "../../../common/constants";
import { AuthTokenService } from "./auth-token.service";

export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly authTokenService: AuthTokenService,
    private readonly googleClient: OAuth2Client
  ) {}

  async localLogin(dto: LocalLoginDto, ip: string | undefined) {
    const { email, password } = dto;

    return this.prismaService.executeTx(async (tx) => {
      const exists = await this.userService.findByEmail(email, tx);
      if (!exists) {
        throw new NotFoundException(Messages.USER.NOT_FOUND);
      }
      if (!exists.passwordHash) {
        throw new BadRequestException(Messages.AUTH.INVALID_CREDENTIALS);
      }
      const isValid = await this.hashService.compare(password, exists.passwordHash!);
      if (!isValid) {
        throw new BadRequestException(Messages.AUTH.INVALID_CREDENTIALS);
      }

      return this.authTokenService.createForUser(exists, email, ip, tx);
    });
  }

  async localSignup(dto: LocalSignupDto, ip?: string) {
    const { email, password, name } = dto;
    // Hashing is intentionally outside the transaction to avoid holding a DB
    // connection during CPU-bound bcrypt work.
    const passwordHash = await this.hashService.hash(password);

    return this.prismaService.executeTx(async (tx) => {
      const exists = await this.userService.findByEmail(email, tx);
      if (exists) {
        throw new ConflictException(Messages.USER.ALREADY_EXISTS);
      }

      const user = await this.userService.createUser(
        {
          email,
          name,
          passwordHash,
          provider: "LOCAL",
          role: "USER",
        },
        tx
      );

      return this.authTokenService.createForUser(user, email, ip, tx);
    });
  }

  async googleLogin(code: string, ip?: string) {
    let email: string | undefined;
    let name: string | undefined;
    let sub: string | undefined;

    try {
      const { tokens } = await this.googleClient.getToken(code);
      if (!tokens.id_token) throw new Error("Google token missing");

      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload?.email;
      name = payload?.name;
      sub = payload?.sub;
      if (!email) throw new Error("Google email missing");
    } catch {
      throw new UnauthorizedException("Invalid Google token or verification failed.");
    }

    return this.prismaService.executeTx(async (tx) => {
      // Atomic upsert removes the find-then-create race for simultaneous OAuth logins.
      const user = await this.userService.upsertGoogleUser({ email: email!, name, providerId: sub }, tx);
      return this.authTokenService.createForUser(user, email!, ip, tx);
    });
  }

  async refreshToken(token: string) {
    return this.prismaService.executeTx(async (tx) => {
      return this.authTokenService.rotate(token, tx);
    });
  }

  async getMe(userId: string) {
    const user = await this.userService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException(Messages.USER.NOT_FOUND);
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
    };
  }

  async logOut(token: string) {
    return this.prismaService.executeTx(async (tx) => {
      await this.authTokenService.revoke(token, tx);
    });
  }
}
