import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { ApiCodes } from '../../common/constants/api-codes';
import { paginate } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from './entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UserProfile } from './entities/user-profile.entity';

const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_HOURS = 24;
const PASSWORD_RESET_TOKEN_HOURS = 1;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ApiException(ApiCodes.EMAIL_ALREADY_IN_USE, HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.dataSource.transaction(async (manager) => {
      const newUser = manager.create(User, {
        email: dto.email,
        passwordHash,
      });
      const savedUser = await manager.save(newUser);

      const profile = manager.create(UserProfile, {
        userId: savedUser.id,
      });
      await manager.save(profile);

      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_HOURS);

      const verificationToken = manager.create(EmailVerificationToken, {
        userId: savedUser.id,
        token,
        expiresAt,
      });
      await manager.save(verificationToken);

      await this.mailService.sendVerificationEmail(savedUser.email, token);

      return savedUser;
    });

    return {
      id: user.id,
      email: user.email,
      message: 'Check your email to verify your account',
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { token },
    });

    if (!verificationToken) {
      throw new ApiException(ApiCodes.INVALID_VERIFICATION_TOKEN);
    }

    if (verificationToken.usedAt) {
      throw new ApiException(ApiCodes.VERIFICATION_TOKEN_ALREADY_USED);
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new ApiException(ApiCodes.VERIFICATION_TOKEN_EXPIRED);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, verificationToken.userId, {
        emailVerifiedAt: new Date(),
      });

      await manager.update(EmailVerificationToken, verificationToken.id, {
        usedAt: new Date(),
      });
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account exists with this email, a verification link has been sent' };
    }

    if (user.emailVerifiedAt) {
      throw new ApiException(ApiCodes.EMAIL_ALREADY_VERIFIED);
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_HOURS);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(EmailVerificationToken)
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: user.id })
        .andWhere('used_at IS NULL')
        .execute();

      const verificationToken = manager.create(EmailVerificationToken, {
        userId: user.id,
        token,
        expiresAt,
      });
      await manager.save(verificationToken);
    });

    await this.mailService.sendVerificationEmail(user.email, token);

    return { message: 'If an account exists with this email, a verification link has been sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent',
      };
    }

    if (!user.emailVerifiedAt) {
      return {
        message:
          'If an account exists with this email, a password reset link has been sent',
      };
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TOKEN_HOURS);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(PasswordResetToken)
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: user.id })
        .andWhere('used_at IS NULL')
        .execute();

      const resetToken = manager.create(PasswordResetToken, {
        userId: user.id,
        token,
        expiresAt,
      });
      await manager.save(resetToken);
    });

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return {
      message:
        'If an account exists with this email, a password reset link has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token: dto.token },
    });

    if (!resetToken) {
      throw new ApiException(ApiCodes.INVALID_RESET_TOKEN);
    }

    if (resetToken.usedAt) {
      throw new ApiException(ApiCodes.RESET_TOKEN_ALREADY_USED);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new ApiException(ApiCodes.RESET_TOKEN_EXPIRED);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.userRepository.findOne({
      where: { id: resetToken.userId },
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, resetToken.userId, {
        passwordHash,
      });
      await manager.update(PasswordResetToken, resetToken.id, {
        usedAt: new Date(),
      });
    });

    if (user) {
      await this.mailService.sendPasswordChangedConfirmation(user.email);
    }

    return { message: 'Password has been reset successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ApiException(ApiCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new ApiException(ApiCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    if (!user.emailVerifiedAt) {
      throw new ApiException(ApiCodes.EMAIL_NOT_VERIFIED, HttpStatus.FORBIDDEN);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      refreshCookieMaxAge: REFRESH_COOKIE_MAX_AGE_MS,
      user: { id: user.id, email: user.email, emailVerifiedAt: user.emailVerifiedAt },
    };
  }

  async refresh(refreshTokenValue: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenValue, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new ApiException(ApiCodes.REFRESH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch {
      throw new ApiException(ApiCodes.REFRESH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
    }
  }

  async getUserInfo(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    const profile = await this.userProfileRepository.findOne({
      where: { userId: user.id },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      profileId: profile?.id ?? null,
    };
  }

  async getUserProfile(userId: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async checkUsernameAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<{ available: boolean }> {
    if (!username || username.length < 3 || username.length > 30) {
      throw new ApiException(ApiCodes.USERNAME_INVALID_LENGTH);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ApiException(ApiCodes.USERNAME_INVALID_CHARS);
    }

    const qb = this.userProfileRepository
      .createQueryBuilder('up')
      .where('up.username = :username', { username });

    if (excludeUserId) {
      qb.andWhere('up.user_id != :excludeUserId', { excludeUserId });
    }

    const existing = await qb.getOne();
    return { available: !existing };
  }

  async searchUsers(
    q: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!q || q.trim().length < 2) {
      throw new ApiException(ApiCodes.SEARCH_QUERY_TOO_SHORT);
    }

    const searchTerm = `%${q.trim()}%`;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .innerJoin('user_profiles', 'up', 'up.user_id = u.id')
      .where('u.email_verified_at IS NOT NULL')
      .andWhere('u.id != :currentUserId', { currentUserId })
      .andWhere('(u.email ILIKE :searchTerm OR up.username ILIKE :searchTerm)', {
        searchTerm,
      })
      .select([
        'u.id',
        'u.email',
        'up.first_name',
        'up.last_name',
        'up.username',
      ])
      .orderBy('u.email', 'ASC');

    const [rawUsers, total] = await Promise.all([
      qb
        .clone()
        .skip((page - 1) * limit)
        .take(limit)
        .getRawMany(),
      qb.getCount(),
    ]);

    const data = rawUsers.map((row: Record<string, unknown>) => ({
      id: row.u_id,
      email: row.u_email,
      firstName: row.up_first_name ?? null,
      lastName: row.up_last_name ?? null,
      username: row.up_username ?? null,
    }));

    return paginate(data, total, page, limit);
  }

  async getPublicProfile(userId: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
    };
  }

  async updateUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; username?: string; avatarUrl?: string },
  ) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    if (data.username && data.username !== profile.username) {
      const existing = await this.userProfileRepository.findOne({
        where: { username: data.username },
      });

      if (existing) {
        throw new ApiException(ApiCodes.USERNAME_TAKEN, HttpStatus.CONFLICT);
      }
    }

    if (data.firstName !== undefined) profile.firstName = data.firstName;
    if (data.lastName !== undefined) profile.lastName = data.lastName;
    if (data.username !== undefined) profile.username = data.username;
    if (data.avatarUrl !== undefined) profile.avatarUrl = data.avatarUrl;

    const saved = await this.userProfileRepository.save(profile);

    return {
      id: saved.id,
      userId: saved.userId,
      firstName: saved.firstName,
      lastName: saved.lastName,
      username: saved.username,
      avatarUrl: saved.avatarUrl,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.accessExpiration') as any,
      },
    );
  }

  private generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpiration') as any,
      },
    );
  }
}
