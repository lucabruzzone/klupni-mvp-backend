import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertActivityActive } from '../../common/utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
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
      throw new NotFoundException('Activity not found');
    }

    assertActivityActive(activity);

    const activeCount = await this.participationRepository.count({
      where: { activityId, status: 'active' },
    });

    if (activeCount >= activity.activityOpen.maxParticipants) {
      throw new BadRequestException(
        'Activity has reached the maximum number of participants',
      );
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
      throw new NotFoundException('Activity not found');
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { id: participationId, activityId, status: 'active' },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found in this activity');
    }

    if (participation.userId === user.id) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (dto.role === 'host' && participation.userId === null) {
      throw new BadRequestException(
        'Only registered users can be assigned the host role',
      );
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
      throw new NotFoundException('Activity not found');
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { id: participationId, activityId, status: 'active' },
    });

    if (!participation) {
      throw new NotFoundException('Active participation not found in this activity');
    }

    if (participation.role === 'host') {
      throw new BadRequestException('Cannot remove a host from the activity');
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
      throw new NotFoundException('Activity not found');
    }
    assertActivityActive(activity);

    const participation = await this.participationRepository.findOne({
      where: { activityId, userId: user.id, status: 'active' },
    });

    if (!participation) {
      throw new NotFoundException('You are not an active participant in this activity');
    }

    if (participation.role === 'host') {
      const otherHostCount = await this.participationRepository.count({
        where: { activityId, role: 'host', status: 'active' },
      });

      if (otherHostCount <= 1) {
        throw new BadRequestException(
          'You are the only host, assign another host before leaving',
        );
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
      throw new ForbiddenException(
        'You do not have permission to modify this activity',
      );
    }
  }
}
