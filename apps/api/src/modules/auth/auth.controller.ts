import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Response } from "express";
import {
  RegisterUserDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "../../shared/index";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  private parseDurationToMs(input: string | undefined, fallbackMs: number): number {
    if (!input) return fallbackMs;
    const v = input.trim();
    const match = /^(\d+)\s*([smhd])$/.exec(v);
    if (!match) return fallbackMs;
    const n = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(n) || n <= 0) return fallbackMs;
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return n * (multipliers[unit] ?? fallbackMs);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === "production";
    const accessMaxAge = this.parseDurationToMs(process.env.JWT_EXPIRATION, 15 * 60 * 1000);
    const refreshMaxAge = this.parseDurationToMs(process.env.JWT_REFRESH_EXPIRATION, 7 * 24 * 60 * 60 * 1000);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: accessMaxAge,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === "production";
    const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };
    res.cookie("access_token", "", { ...base, maxAge: 0 });
    res.cookie("refresh_token", "", { ...base, maxAge: 0 });
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register new user with tenant" })
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result: any = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    const { accessToken, refreshToken, ...safe } = result;
    return { ...safe, accessToken, refreshToken };
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const result: any = await this.authService.login(
      dto,
      req.ip,
      req.headers["user-agent"]
    );
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    const { accessToken, refreshToken, ...safe } = result;
    return { ...safe, accessToken, refreshToken };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") refreshToken?: string
  ) {
    const token = refreshToken || req.cookies?.refresh_token;
    const result: any = await this.authService.refreshToken({ refreshToken: token });
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken, refreshed: true };
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any) {
    return this.authService.forgotPassword(dto, req.ip, req.headers["user-agent"]);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout and revoke refresh token" })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body("refreshToken") refreshToken: string | undefined
  ) {
    const token = refreshToken || req.cookies?.refresh_token;
    const result = await this.authService.logout(token);
    this.clearAuthCookies(res);
    return result;
  }

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth login" })
  async googleAuth() {}

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result: any = await this.authService.googleLogin(req.user);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    const { accessToken, refreshToken, ...safe } = result;
    return { ...safe, accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async me(@CurrentUser() user: any) {
    return user;
  }
}
