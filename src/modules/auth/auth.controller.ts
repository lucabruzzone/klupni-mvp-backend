import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { ApiCodes } from '../../common/constants/api-codes';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
import { ApiException } from '../../common/exceptions/api.exception';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { User } from './entities/user.entity';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ── Auth endpoints ────────────────────────────────────────────────────────

  @Public()
  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    const { apiCode, ...data } = result;
    return ResponseFactory.created(apiCode, data);
  }

  @Public()
  @Get('auth/verify-email')
  async verifyEmail(@Query('token') token: string) {
    const result = await this.authService.verifyEmail(token);
    return ResponseFactory.ok(ApiCodes.EMAIL_VERIFIED, result);
  }

  @Public()
  @Post('auth/resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    const result = await this.authService.resendVerification(dto);
    return ResponseFactory.ok(ApiCodes.VERIFICATION_EMAIL_SENT, result);
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return ResponseFactory.ok(ApiCodes.PASSWORD_RESET_EMAIL_SENT, result);
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return ResponseFactory.ok(ApiCodes.PASSWORD_RESET, result);
  }

  @Public()
  @Post('auth/firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseAuth(
    @Body() dto: FirebaseAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.firebaseAuth(dto.idToken);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: result.refreshCookieMaxAge,
      path: '/',
    });

    return ResponseFactory.ok(ApiCodes.LOGIN_SUCCESS, {
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: result.refreshCookieMaxAge,
      path: '/',
    });

    return ResponseFactory.ok(ApiCodes.LOGIN_SUCCESS, {
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new ApiException(ApiCodes.REFRESH_TOKEN_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.authService.refresh(refreshToken);
      return ResponseFactory.ok(ApiCodes.REFRESH_SUCCESS, result);
    } catch {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      throw new ApiException(ApiCodes.REFRESH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return ResponseFactory.ok(ApiCodes.LOGOUT_SUCCESS);
  }

  @Get('auth/providers')
  async getProviders(@CurrentUser() user: User) {
    const result = await this.authService.getLinkedProviders(user.id);
    return ResponseFactory.ok(ApiCodes.OAUTH_PROVIDERS_RETRIEVED, result);
  }

  @Delete('auth/providers/:provider')
  @HttpCode(HttpStatus.OK)
  async unlinkProvider(
    @CurrentUser() user: User,
    @Param('provider') provider: string,
  ) {
    const result = await this.authService.unlinkProvider(user.id, provider);
    return ResponseFactory.ok(ApiCodes.OAUTH_PROVIDER_UNLINKED, result);
  }

  // ── User endpoints ────────────────────────────────────────────────────────

  @Get('users/me')
  async getMe(@CurrentUser() user: User) {
    const result = await this.authService.getUserInfo(user.id);
    return ResponseFactory.ok(ApiCodes.USER_INFO_RETRIEVED, result);
  }

  @Get('users/profile')
  async getProfile(@CurrentUser() user: User) {
    const result = await this.authService.getUserProfile(user.id);
    return ResponseFactory.ok(ApiCodes.USER_PROFILE_RETRIEVED, result);
  }

  @Patch('users/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const result = await this.authService.updateUserProfile(user.id, dto);
    return ResponseFactory.ok(ApiCodes.USER_PROFILE_UPDATED, result);
  }

  @Public()
  @Get('users/check-username')
  async checkUsername(
    @Query('username') username: string,
    @Query('excludeUserId') excludeUserId?: string,
  ) {
    const result = await this.authService.checkUsernameAvailable(username, excludeUserId);
    return ResponseFactory.ok(ApiCodes.USERNAME_CHECK_RESULT, result);
  }

  @Get('users/search')
  async searchUsers(
    @Query() query: SearchUsersQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.authService.searchUsers(query.q, user.id, page, limit);
    return ResponseFactory.paginated(ApiCodes.USERS_SEARCH_SUCCESS, result.data, result.meta);
  }

  @Get('users/:userId/profile')
  async getPublicProfile(@Param('userId') userId: string) {
    const result = await this.authService.getPublicProfile(userId);
    return ResponseFactory.ok(ApiCodes.USER_PUBLIC_PROFILE_RETRIEVED, result);
  }
}
