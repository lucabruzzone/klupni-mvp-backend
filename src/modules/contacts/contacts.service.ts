import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiCodes } from '../../common/constants/api-codes';
import { paginate } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { ExternalContact } from '../external-contacts/entities/external-contact.entity';
import { Contact } from './entities/contact.entity';
import { AddContactDto } from './dto/add-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { RemoveContactsBatchDto } from './dto/remove-contacts-batch.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ExternalContact)
    private readonly externalContactRepository: Repository<ExternalContact>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  async add(dto: AddContactDto, ownerUser: User) {
    if (!dto.userId && !dto.externalContactId) {
      throw new ApiException(ApiCodes.CONTACT_USER_OR_EXTERNAL_REQUIRED);
    }
    if (dto.userId && dto.externalContactId) {
      throw new ApiException(ApiCodes.CONTACT_BOTH_PROVIDED);
    }

    if (dto.userId) {
      if (dto.userId === ownerUser.id) {
        throw new ApiException(ApiCodes.CONTACT_CANNOT_ADD_SELF);
      }

      const targetUser = await this.contactRepository.manager.findOne(User, {
        where: { id: dto.userId },
      });
      if (!targetUser) {
        throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const existing = await this.contactRepository.findOne({
        where: {
          ownerUserId: ownerUser.id,
          userId: dto.userId,
        },
      });
      if (existing) {
        throw new ApiException(ApiCodes.CONTACT_ALREADY_ADDED);
      }

      const contact = this.contactRepository.create({
        ownerUserId: ownerUser.id,
        userId: dto.userId,
        externalContactId: null,
      });
      const saved = await this.contactRepository.save(contact);

      const profile = await this.userProfileRepository.findOne({
        where: { userId: dto.userId },
      });
        const displayName = this.buildUserDisplayName(profile, targetUser.email);

      return {
        id: saved.id,
        type: 'user',
        userId: saved.userId,
        externalContactId: null,
        displayName,
        email: targetUser.email ?? null,
        createdAt: saved.createdAt,
      };
    } else {
      const externalContact = await this.externalContactRepository.findOne({
        where: { id: dto.externalContactId!, ownerUserId: ownerUser.id },
      });
      if (!externalContact) {
        throw new ApiException(
          ApiCodes.EXTERNAL_CONTACT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const existing = await this.contactRepository.findOne({
        where: {
          ownerUserId: ownerUser.id,
          externalContactId: dto.externalContactId,
        },
      });
      if (existing) {
        throw new ApiException(ApiCodes.CONTACT_ALREADY_ADDED);
      }

      const contact = this.contactRepository.create({
        ownerUserId: ownerUser.id,
        userId: null,
        externalContactId: dto.externalContactId,
      });
      const saved = await this.contactRepository.save(contact);

      return {
        id: saved.id,
        type: 'external_contact',
        userId: null,
        externalContactId: saved.externalContactId,
        displayName: externalContact.alias,
        email: externalContact.email,
        createdAt: saved.createdAt,
      };
    }
  }

  async remove(id: string, ownerUser: User) {
    const contact = await this.contactRepository.findOne({
      where: { id, ownerUserId: ownerUser.id },
    });

    if (!contact) {
      throw new ApiException(ApiCodes.CONTACT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.contactRepository.softRemove(contact);
  }

  async removeBatch(dto: RemoveContactsBatchDto, ownerUser: User) {
    const contacts = await this.contactRepository.find({
      where: dto.ids.map((id) => ({ id, ownerUserId: ownerUser.id })),
    });

    if (contacts.length > 0) {
      await this.contactRepository.softRemove(contacts);
    }

    return { deletedCount: contacts.length };
  }

  async findAll(
    ownerUser: User,
    query: ListContactsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const type = query.type ?? 'all';

    const qb = this.contactRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .leftJoinAndSelect('c.externalContact', 'ec')
      .where('c.owner_user_id = :ownerUserId', { ownerUserId: ownerUser.id })
      .andWhere('c.deleted_at IS NULL');

    if (type === 'user') {
      qb.andWhere('c.user_id IS NOT NULL');
    } else if (type === 'external_contact') {
      qb.andWhere('c.external_contact_id IS NOT NULL');
    }

    const [contacts, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const userIds = contacts
      .filter((c) => c.userId)
      .map((c) => c.userId!);
    const profiles =
      userIds.length > 0
        ? await this.userProfileRepository.find({
            where: userIds.map((id) => ({ userId: id })),
          })
        : [];
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const data = contacts.map((c) => {
      if (c.userId && c.user) {
        const profile = profileMap.get(c.userId);
        const displayName = this.buildUserDisplayName(
          profile,
          c.user?.email ?? null,
        );
        return {
          id: c.id,
          type: 'user' as const,
          userId: c.userId,
          externalContactId: null,
          displayName,
          email: c.user?.email ?? null,
          createdAt: c.createdAt,
        };
      } else {
        return {
          id: c.id,
          type: 'external_contact' as const,
          userId: null,
          externalContactId: c.externalContactId,
          displayName: c.externalContact?.alias ?? null,
          email: c.externalContact?.email ?? null,
          createdAt: c.createdAt,
        };
      }
    });

    return paginate(data, total, page, limit);
  }

  async createContactForExternal(
    ownerUserId: string,
    externalContactId: string,
  ): Promise<Contact> {
    const contact = this.contactRepository.create({
      ownerUserId,
      userId: null,
      externalContactId,
    });
    return this.contactRepository.save(contact);
  }

  private buildUserDisplayName(
    profile: UserProfile | undefined | null,
    email: string | null,
  ): string | null {
    if (profile) {
      const parts = [profile.firstName, profile.lastName].filter(Boolean);
      if (parts.length > 0) return parts.join(' ');
      if (profile.username) return profile.username;
    }
    return email;
  }
}
