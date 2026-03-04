import { HttpStatus, Injectable } from '@nestjs/common';
import { assertActivityActive } from '../../common/utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ApiCodes } from '../../common/constants/api-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { AddFreeParticipantDto } from './dto/add-free-participant.dto';
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
  ) {}

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

    participation.status = 'removed';
    await this.participationRepository.save(participation);

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

    participation.status = 'left';
    await this.participationRepository.save(participation);

    return { message: 'You have left the activity' };
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
