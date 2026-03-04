import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertActivityActive } from './utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { ActivityInvitation } from '../invitations/entities/activity-invitation.entity';
import { Activity } from './entities/activity.entity';
import { ActivityOpen } from './entities/activity-open.entity';
import { ActivityParticipation } from './entities/activity-participation.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';
import { paginate } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityOpen)
    private readonly activityOpenRepository: Repository<ActivityOpen>,
    @InjectRepository(ActivityParticipation)
    private readonly participationRepository: Repository<ActivityParticipation>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(ActivityInvitation)
    private readonly invitationRepository: Repository<ActivityInvitation>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateActivityDto, user: User) {
    const result = await this.dataSource.transaction(async (manager) => {
      const activity = manager.create(Activity, {
        createdByUserId: user.id,
        title: dto.title,
        description: dto.description ?? null,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        status: 'open',
      });
      const savedActivity = await manager.save(activity);

      const activityOpen = manager.create(ActivityOpen, {
        activityId: savedActivity.id,
        sportName: dto.sportName ?? null,
        locationText: dto.locationText ?? null,
        maxParticipants: dto.maxParticipants,
        minParticipants: dto.minParticipants,
      });
      const savedOpen = await manager.save(activityOpen);

      const participation = manager.create(ActivityParticipation, {
        activityId: savedActivity.id,
        userId: user.id,
        externalContactId: null,
        role: 'host',
        status: 'active',
        joinedAt: new Date(),
      });
      await manager.save(participation);

      return { ...savedActivity, activityOpen: savedOpen };
    });

    return this.formatActivity(result, result.activityOpen);
  }

  async findAll(query: ListActivitiesQueryDto, user: User) {
    const type = query.type ?? 'all';
    const time = query.time ?? 'upcoming';
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.activityRepository
      .createQueryBuilder('a')
      .innerJoin('a.activityOpen', 'ao')
      .leftJoin(
        'activity_participations',
        'ap_count',
        'ap_count.activity_id = a.id AND ap_count.status = :activeStatus AND ap_count.deleted_at IS NULL',
        { activeStatus: 'active' },
      )
      .select([
        'a.id AS id',
        'a.title AS title',
        'ao.sport_name AS "sportName"',
        'ao.location_text AS "locationText"',
        'a.start_at AS "startAt"',
        'a.end_at AS "endAt"',
        'a.status AS status',
        'ao.max_participants AS "maxParticipants"',
        'ao.min_participants AS "minParticipants"',
        'a.created_at AS "createdAt"',
        'COUNT(ap_count.id) AS "participantCount"',
      ])
      .where('a.deleted_at IS NULL')
      .groupBy('a.id, ao.id');

    if (time === 'upcoming') {
      qb.andWhere('a.start_at >= :now', { now: new Date() });
      qb.orderBy('a.start_at', 'ASC');
    } else if (time === 'past') {
      qb.andWhere('a.start_at < :now', { now: new Date() });
      qb.orderBy('a.start_at', 'DESC');
    } else {
      qb.orderBy('a.start_at', 'ASC');
    }

    if (type === 'created') {
      qb.andWhere('a.created_by_user_id = :userId', { userId: user.id });
    } else if (type === 'participating') {
      qb.innerJoin(
        'activity_participations',
        'ap_filter',
        'ap_filter.activity_id = a.id AND ap_filter.user_id = :userId AND ap_filter.status = :activeStatus AND ap_filter.deleted_at IS NULL',
        { userId: user.id, activeStatus: 'active' },
      );
    } else {
      qb.andWhere(
        `(a.created_by_user_id = :userId OR EXISTS (
          SELECT 1 FROM activity_participations ap2
          WHERE ap2.activity_id = a.id
            AND ap2.user_id = :userId
            AND ap2.status = 'active'
            AND ap2.deleted_at IS NULL
        ))`,
        { userId: user.id },
      );
    }

    const countQb = this.activityRepository
      .createQueryBuilder('a')
      .innerJoin('a.activityOpen', 'ao')
      .where('a.deleted_at IS NULL');

    if (time === 'upcoming') {
      countQb.andWhere('a.start_at >= :now', { now: new Date() });
    } else if (time === 'past') {
      countQb.andWhere('a.start_at < :now', { now: new Date() });
    }

    if (type === 'created') {
      countQb.andWhere('a.created_by_user_id = :userId', { userId: user.id });
    } else if (type === 'participating') {
      countQb.innerJoin(
        'activity_participations',
        'ap_filter',
        'ap_filter.activity_id = a.id AND ap_filter.user_id = :userId AND ap_filter.status = :activeStatus AND ap_filter.deleted_at IS NULL',
        { userId: user.id, activeStatus: 'active' },
      );
    } else {
      countQb.andWhere(
        `(a.created_by_user_id = :userId OR EXISTS (
          SELECT 1 FROM activity_participations ap2
          WHERE ap2.activity_id = a.id
            AND ap2.user_id = :userId
            AND ap2.status = 'active'
            AND ap2.deleted_at IS NULL
        ))`,
        { userId: user.id },
      );
    }

    const total = await countQb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{
      id: string;
      title: string;
      sportName: string | null;
      locationText: string | null;
      startAt: Date;
      endAt: Date | null;
      status: string;
      maxParticipants: number;
      minParticipants: number;
      createdAt: Date;
      participantCount: string;
    }>();

    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      sportName: r.sportName,
      locationText: r.locationText,
      startAt: r.startAt,
      endAt: r.endAt,
      status: r.status,
      maxParticipants: Number(r.maxParticipants),
      minParticipants: Number(r.minParticipants),
      createdAt: r.createdAt,
      participantCount: Number(r.participantCount),
    }));

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['activityOpen'],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const participations = await this.participationRepository.find({
      where: { activityId: id, status: 'active' },
      relations: ['user'],
    });

    const participantList = participations.map((p) => ({
      id: p.id,
      role: p.role,
      joinedAt: p.joinedAt,
      ...(p.userId
        ? { user: { userId: p.userId, email: p.user?.email ?? null } }
        : {
            externalContact: {
              externalContactId: p.externalContactId,
            },
          }),
    }));

    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      startAt: activity.startAt,
      endAt: activity.endAt,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      activityOpen: activity.activityOpen
        ? {
            sportName: activity.activityOpen.sportName,
            locationText: activity.activityOpen.locationText,
            maxParticipants: activity.activityOpen.maxParticipants,
            minParticipants: activity.activityOpen.minParticipants,
          }
        : null,
      participants: participantList,
    };
  }

  async update(id: string, dto: UpdateActivityDto, user: User) {
    await this.assertHost(id, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['activityOpen'],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    assertActivityActive(activity);

    await this.dataSource.transaction(async (manager) => {
      if (dto.title !== undefined) activity.title = dto.title;
      if (dto.description !== undefined)
        activity.description = dto.description ?? null;
      if (dto.startAt !== undefined) activity.startAt = new Date(dto.startAt);
      if (dto.endAt !== undefined)
        activity.endAt = dto.endAt ? new Date(dto.endAt) : null;
      await manager.save(activity);

      const open = activity.activityOpen;
      if (dto.sportName !== undefined) open.sportName = dto.sportName ?? null;
      if (dto.locationText !== undefined)
        open.locationText = dto.locationText ?? null;
      if (dto.maxParticipants !== undefined)
        open.maxParticipants = dto.maxParticipants;
      if (dto.minParticipants !== undefined)
        open.minParticipants = dto.minParticipants;
      await manager.save(open);
    });

    const updated = await this.activityRepository.findOne({
      where: { id },
      relations: ['activityOpen'],
    });

    return this.formatActivity(updated!, updated!.activityOpen);
  }

  async remove(id: string, user: User) {
    await this.assertHost(id, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['activityOpen'],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    assertActivityActive(activity);

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Activity, id);
      if (activity.activityOpen) {
        await manager.softDelete(ActivityOpen, activity.activityOpen.id);
      }
    });

    return { message: 'Activity deleted successfully' };
  }

  async listParticipants(activityId: string, query: ListParticipantsQueryDto) {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const filter = query.status ?? 'all';
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result: Array<{
      type: 'user' | 'external_contact' | 'free' | 'invited';
      participationId: string | null;
      invitationId: string | null;
      role: string | null;
      status: string;
      displayName: string | null;
      avatarUrl: string | null;
      userId: string | null;
      externalContactId: string | null;
    }> = [];

    if (filter === 'confirmed' || filter === 'all') {
      const participations = await this.participationRepository.find({
        where: { activityId, status: 'active' },
        relations: ['user', 'externalContact'],
        order: { joinedAt: 'ASC' },
      });

      const userIds = participations
        .filter((p) => p.userId)
        .map((p) => p.userId!);

      const profiles = userIds.length > 0
        ? await this.userProfileRepository
            .createQueryBuilder('up')
            .where('up.userId IN (:...userIds)', { userIds })
            .getMany()
        : [];

      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      for (const p of participations) {
        if (p.userId) {
          const profile = profileMap.get(p.userId);
          const name = [profile?.firstName, profile?.lastName]
            .filter(Boolean)
            .join(' ') || profile?.username || p.user?.email || null;

          result.push({
            type: 'user',
            participationId: p.id,
            invitationId: null,
            role: p.role,
            status: 'confirmed',
            displayName: name,
            avatarUrl: profile?.avatarUrl ?? null,
            userId: p.userId,
            externalContactId: null,
          });
        } else if (p.externalContactId) {
          result.push({
            type: 'external_contact',
            participationId: p.id,
            invitationId: null,
            role: p.role,
            status: 'confirmed',
            displayName: p.externalContact?.alias ?? null,
            avatarUrl: null,
            userId: null,
            externalContactId: p.externalContactId,
          });
        } else {
          result.push({
            type: 'free',
            participationId: p.id,
            invitationId: null,
            role: p.role,
            status: 'confirmed',
            displayName: p.alias,
            avatarUrl: null,
            userId: null,
            externalContactId: null,
          });
        }
      }
    }

    if (filter === 'pending' || filter === 'all') {
      const pendingInvitations = await this.invitationRepository.find({
        where: { activityId, status: 'pending' },
        relations: ['user', 'externalContact'],
        order: { createdAt: 'ASC' },
      });

      const invUserIds = pendingInvitations
        .filter((inv) => inv.userId)
        .map((inv) => inv.userId!);

      const invProfiles = invUserIds.length > 0
        ? await this.userProfileRepository
            .createQueryBuilder('up')
            .where('up.userId IN (:...invUserIds)', { invUserIds })
            .getMany()
        : [];

      const invProfileMap = new Map(invProfiles.map((p) => [p.userId, p]));

      for (const inv of pendingInvitations) {
        if (inv.userId) {
          const profile = invProfileMap.get(inv.userId);
          const name = [profile?.firstName, profile?.lastName]
            .filter(Boolean)
            .join(' ') || profile?.username || inv.email || null;

          result.push({
            type: 'user',
            participationId: null,
            invitationId: inv.id,
            role: null,
            status: 'pending',
            displayName: name,
            avatarUrl: profile?.avatarUrl ?? null,
            userId: inv.userId,
            externalContactId: null,
          });
        } else if (inv.externalContactId) {
          result.push({
            type: 'external_contact',
            participationId: null,
            invitationId: inv.id,
            role: null,
            status: 'pending',
            displayName: inv.externalContact?.alias ?? inv.email,
            avatarUrl: null,
            userId: null,
            externalContactId: inv.externalContactId,
          });
        }
      }
    }

    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);

    return paginate(data, total, page, limit);
  }

  private async assertHost(activityId: string, userId: string): Promise<void> {
    const participation = await this.participationRepository.findOne({
      where: { activityId, userId, role: 'host', status: 'active' },
    });

    if (!participation) {
      throw new ForbiddenException(
        'You do not have permission to modify this activity',
      );
    }
  }

  private formatActivity(activity: Activity, open: ActivityOpen) {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      startAt: activity.startAt,
      endAt: activity.endAt,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      activityOpen: {
        sportName: open.sportName,
        locationText: open.locationText,
        maxParticipants: open.maxParticipants,
        minParticipants: open.minParticipants,
      },
    };
  }
}
