import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UserAuthProvider } from './entities/user-auth-provider.entity';
import { UserProfile } from './entities/user-profile.entity';

export type OAuthProviderType = 'google' | 'github' | 'apple' | 'facebook';

export interface HandleOAuthCallbackParams {
  provider: OAuthProviderType;
  providerUserId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuthProvider)
    private readonly userAuthProviderRepository: Repository<UserAuthProvider>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async handleOAuthCallback(
    params: HandleOAuthCallbackParams,
  ): Promise<{ user: User; isNewUser: boolean }> {
    const { provider, providerUserId, email, accessToken, refreshToken, tokenExpiresAt, profile } =
      params;

    // 1. Buscar por (provider, providerUserId) — si existe, retornar sin hacer nada más
    const existingProvider = await this.userAuthProviderRepository.findOne({
      where: { provider, providerUserId },
      relations: ['user'],
    });

    if (existingProvider?.user) {
      return { user: existingProvider.user, isNewUser: false };
    }

    // 2. Buscar por email (cualquier provider) — account linking
    const providerByEmail = await this.userAuthProviderRepository.findOne({
      where: { email },
      relations: ['user'],
    });

    let userId: string;
    let isNewUser: boolean;

    if (providerByEmail?.user) {
      userId = providerByEmail.user.id;
      isNewUser = false;

      // Si email no verificado, OAuth confirma la propiedad del email
      if (!providerByEmail.user.emailVerifiedAt) {
        await this.userRepository.update(userId, {
          emailVerifiedAt: new Date(),
        });
      }
    } else {
      // 3. No hay match — crear nuevo User
      userId = await this.dataSource.transaction(async (manager) => {
        const newUser = manager.create(User, {
          email,
          emailVerifiedAt: new Date(),
        });
        const savedUser = await manager.save(newUser);

        const authProvider = manager.create(UserAuthProvider, {
          userId: savedUser.id,
          provider,
          providerUserId,
          email,
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
          tokenExpiresAt: tokenExpiresAt ?? null,
        });
        await manager.save(authProvider);

        const userProfile = manager.create(UserProfile, {
          userId: savedUser.id,
          firstName: profile?.firstName ?? null,
          lastName: profile?.lastName ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        });
        await manager.save(userProfile);

        return savedUser.id;
      });
      isNewUser = true;
    }

    // 4. Si no es usuario nuevo, crear solo el UserAuthProvider (account linking)
    if (!isNewUser) {
      const authProvider = this.userAuthProviderRepository.create({
        userId,
        provider,
        providerUserId,
        email,
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
        tokenExpiresAt: tokenExpiresAt ?? null,
      });
      await this.userAuthProviderRepository.save(authProvider);

      // Completar UserProfile solo con campos null o vacíos
      if (profile && (profile.firstName || profile.lastName || profile.avatarUrl)) {
        const userProfile = await this.userProfileRepository.findOne({
          where: { userId },
        });
        if (userProfile) {
          const updates: Partial<UserProfile> = {};
          if (
            (profile.firstName ?? '').trim() &&
            (userProfile.firstName == null || userProfile.firstName.trim() === '')
          ) {
            updates.firstName = profile.firstName!.trim();
          }
          if (
            (profile.lastName ?? '').trim() &&
            (userProfile.lastName == null || userProfile.lastName.trim() === '')
          ) {
            updates.lastName = profile.lastName!.trim();
          }
          if (
            (profile.avatarUrl ?? '').trim() &&
            (userProfile.avatarUrl == null || userProfile.avatarUrl.trim() === '')
          ) {
            updates.avatarUrl = profile.avatarUrl!.trim();
          }
          if (Object.keys(updates).length > 0) {
            await this.userProfileRepository.update(userProfile.id, updates);
          }
        }
      }
    }

    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });

    return { user, isNewUser };
  }
}
