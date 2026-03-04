import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
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
    return this.authService.register(dto);
  }

  @Public()
  @Get('auth/verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('auth/resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
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
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      return await this.authService.refresh(refreshToken);
    } catch {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ── User endpoints ────────────────────────────────────────────────────────

  @Get('users/me')
  async getMe(@CurrentUser() user: User) {
    return this.authService.getUserInfo(user.id);
  }

  @Get('users/profile')
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getUserProfile(user.id);
  }

  @Patch('users/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateUserProfile(user.id, dto);
  }

  @Public()
  @Get('users/check-username')
  async checkUsername(
    @Query('username') username: string,
    @Query('excludeUserId') excludeUserId?: string,
  ) {
    return this.authService.checkUsernameAvailable(username, excludeUserId);
  }

  @Get('users/search')
  async searchUsers(
    @Query() query: SearchUsersQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.authService.searchUsers(query.q, user.id, page, limit);
  }

  @Get('users/:userId/profile')
  async getPublicProfile(@Param('userId') userId: string) {
    return this.authService.getPublicProfile(userId);
  }
}
