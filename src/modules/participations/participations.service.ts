import { HttpStatus, Injectable } from '@nestjs/common';
import { assertActivityActive } from '../../common/utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ActivityTeamMember } from '../activities/entities/activity-team-member.entity';
import { ActivityInvitation } from '../invitations/entities/activity-invitation.entity';
import { ExternalContact } from '../external-contacts/entities/external-contact.entity';
import { ApiCodes } from '../../common/constants/api-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { AddFreeParticipantDto } from './dto/add-free-participant.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityOpen)
    private readonly activityOpenRepository: Repository<ActivityOpen>,
    @InjectRepository(ActivityParticipation)
    private readonly participationRepository: Repository<ActivityParticipation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ExternalContact)
    private readonly externalContactRepository: Repository<ExternalContact>,
    @InjectRepository(ActivityInvitation)
    private readonly invitationRepository: Repository<ActivityInvitation>,
    @InjectRepository(ActivityTeamMember)
    private readonly teamMemberRepository: Repository<ActivityTeamMember>,
    private readonly dataSource: DataSource,
  ) {}

  async addParticipant(
    activityId: string,
    dto: AddParticipantDto,
    hostUser: User,
  ) {
    if (!dto.userId && !dto.externalContactId) {
      throw new ApiException(ApiCodes.INVITATION_USER_OR_CONTACT_REQUIRED);
    }
    if (dto.userId && dto.externalContactId) {
      throw new ApiException(ApiCodes.INVITATION_BOTH_PROVIDED);
    }

    await this.assertHost(activityId, hostUser.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['activityOpen'],
    });

    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    assertActivityActive(activity);

    const activeCount = await this.participationRepository.count({
      where: { activityId, status: 'active' },
    });

    if (activeCount >= activity.activityOpen.maxParticipants) {
      throw new ApiException(ApiCodes.ACTIVITY_FULL);
    }

    let userId: string | null = null;
    let externalContactId: string | null = null;

    if (dto.userId) {
      if (dto.userId === hostUser.id) {
        throw new ApiException(ApiCodes.INVITATION_CANNOT_INVITE_SELF);
      }

      const targetUser = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!targetUser) {
        throw new ApiException(ApiCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const existingActive = await this.participationRepository.findOne({
        where: { activityId, userId: dto.userId, status: 'active' },
      });
      if (existingActive) {
        throw new ApiException(ApiCodes.USER_ALREADY_PARTICIPANT);
      }

      userId = dto.userId;
    } else {
      const contact = await this.externalContactRepository.findOne({
        where: { id: dto.externalContactId!, ownerUserId: hostUser.id },
      });
      if (!contact) {
        throw new ApiException(
          ApiCodes.EXTERNAL_CONTACT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const existingActive = await this.participationRepository.findOne({
        where: {
          activityId,
          externalContactId: dto.externalContactId,
          status: 'active',
        },
      });
      if (existingActive) {
        throw new ApiException(
          ApiCodes.EXTERNAL_CONTACT_ALREADY_PARTICIPANT,
        );
      }

      externalContactId = dto.externalContactId ?? null;
    }

    const now = new Date();
    const existingInactive = await this.participationRepository.findOne({
      where: userId
        ? { activityId, userId }
        : { activityId, externalContactId: externalContactId! },
    });

    let saved: ActivityParticipation;
    if (existingInactive && existingInactive.status !== 'active') {
      existingInactive.status = 'active';
      existingInactive.role = 'participant';
      existingInactive.joinedAt = now;
      existingInactive.confirmedAt = null;
      saved = await this.participationRepository.save(existingInactive);
    } else {
      const participation = this.participationRepository.create({
        activityId,
        userId,
        externalContactId,
        role: 'participant',
        status: 'active',
        joinedAt: now,
        confirmedAt: null,
      });
      saved = await this.participationRepository.save(participation);
    }

    return {
      id: saved.id,
      activityId: saved.activityId,
      userId: saved.userId,
      externalContactId: saved.externalContactId,
      role: saved.role,
      status: saved.status,
      joinedAt: saved.joinedAt,
      confirmedAt: saved.confirmedAt,
      createdAt: saved.createdAt,
    };
  }

  async addFreeParticipant(
    activityId: string,
    dto: AddFreeParticipantDto,
    user: User,
  ) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['activityOpen'],
    });

    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    assertActivityActive(activity);

    const activeCount = await this.participationRepository.count({
      where: { activityId, status: 'active' },
    });

    if (activeCount >= activity.activityOpen.maxParticipants) {
      throw new ApiException(ApiCodes.ACTIVITY_FULL);
    }

    const participation = this.participationRepository.create({
      activityId,
      userId: null,
      externalContactId: null,
      alias: dto.alias,
      role: 'participant',
      status: 'active',
      joinedAt: new Date(),
      confirmedAt: new Date(),
    });

    const saved = await this.participationRepository.save(participation);

    return {
      id: saved.id,
      activityId: saved.activityId,
      alias: saved.alias,
      role: saved.role,
      status: saved.status,
      joinedAt: saved.joinedAt,
      createdAt: saved.createdAt,
    };
  }

  async updateRole(
    activityId: string,
    participationId: string,
    dto: UpdateRoleDto,
    user: User,
  ) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { id: participationId, activityId, status: 'active' },
    });

    if (!participation) {
      throw new ApiException(ApiCodes.PARTICIPATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (participation.userId === user.id) {
      throw new ApiException(ApiCodes.CANNOT_CHANGE_OWN_ROLE);
    }

    if (dto.role === 'host' && participation.userId === null) {
      throw new ApiException(ApiCodes.ONLY_REGISTERED_CAN_BE_HOST);
    }

    participation.role = dto.role;
    await this.participationRepository.save(participation);

    return {
      id: participation.id,
      activityId: participation.activityId,
      userId: participation.userId,
      externalContactId: participation.externalContactId,
      role: participation.role,
      status: participation.status,
      joinedAt: participation.joinedAt,
      updatedAt: participation.updatedAt,
    };
  }

  async removeParticipant(
    activityId: string,
    participationId: string,
    user: User,
  ) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { id: participationId, activityId, status: 'active' },
    });

    if (!participation) {
      throw new ApiException(ApiCodes.ACTIVE_PARTICIPATION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (participation.role === 'host') {
      throw new ApiException(ApiCodes.CANNOT_REMOVE_HOST);
    }

    await this.dataSource.transaction(async (manager) => {
      participation.status = 'removed';
      await manager.save(participation);

      await manager
        .getRepository(ActivityTeamMember)
        .delete({ activityParticipationId: participation.id });

      const invRepo = manager.getRepository(ActivityInvitation);
      const qb = invRepo
        .createQueryBuilder()
        .update(ActivityInvitation)
        .set({ status: 'cancelled' })
        .where('activity_id = :activityId', { activityId })
        .andWhere('status = :status', { status: 'pending' });
      if (participation.userId) {
        qb.andWhere('user_id = :userId', { userId: participation.userId });
      } else {
        qb.andWhere('external_contact_id = :externalContactId', {
          externalContactId: participation.externalContactId!,
        });
      }
      await qb.execute();
    });

    return { message: 'Participant removed successfully' };
  }

  async leaveActivity(activityId: string, user: User) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { activityId, userId: user.id, status: 'active' },
    });

    if (!participation) {
      throw new ApiException(ApiCodes.NOT_ACTIVE_PARTICIPANT, HttpStatus.NOT_FOUND);
    }

    if (participation.role === 'host') {
      const otherHostCount = await this.participationRepository.count({
        where: { activityId, role: 'host', status: 'active' },
      });

      if (otherHostCount <= 1) {
        throw new ApiException(ApiCodes.CANNOT_REMOVE_SOLE_HOST);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      participation.status = 'left';
      await manager.save(participation);

      await manager
        .getRepository(ActivityTeamMember)
        .delete({ activityParticipationId: participation.id });

      const invRepo = manager.getRepository(ActivityInvitation);
      const qb = invRepo
        .createQueryBuilder()
        .update(ActivityInvitation)
        .set({ status: 'cancelled' })
        .where('activity_id = :activityId', { activityId })
        .andWhere('status = :status', { status: 'pending' });
      if (participation.userId) {
        qb.andWhere('user_id = :userId', { userId: participation.userId });
      } else {
        qb.andWhere('external_contact_id = :externalContactId', {
          externalContactId: participation.externalContactId!,
        });
      }
      await qb.execute();
    });

    return { message: 'You have left the activity' };
  }

  private async removeFromTeams(participationId: string): Promise<void> {
    await this.teamMemberRepository.delete({ activityParticipationId: participationId });
  }

  private async cancelInvitationsForParticipant(
    activityId: string,
    userId: string | null,
    externalContactId: string | null,
  ): Promise<void> {
    if (!userId && !externalContactId) return;

    const qb = this.invitationRepository
      .createQueryBuilder()
      .update(ActivityInvitation)
      .set({ status: 'cancelled' })
      .where('activity_id = :activityId', { activityId })
      .andWhere('status = :status', { status: 'pending' });

    if (userId) {
      qb.andWhere('user_id = :userId', { userId });
    } else {
      qb.andWhere('external_contact_id = :externalContactId', { externalContactId: externalContactId! });
    }

    await qb.execute();
  }

  private async assertHost(activityId: string, userId: string): Promise<void> {
    const hostParticipation = await this.participationRepository.findOne({
      where: { activityId, userId, role: 'host', status: 'active' },
    });

    if (!hostParticipation) {
      throw new ApiException(ApiCodes.ACTIVITY_MODIFY_FORBIDDEN, HttpStatus.FORBIDDEN);
    }
  }
}
