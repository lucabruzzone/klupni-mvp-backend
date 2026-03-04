import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertActivityActive } from '../../common/utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ExternalContact } from '../external-contacts/entities/external-contact.entity';
import {
  ActivityInvitation,
  InvitationStatus,
} from './entities/activity-invitation.entity';
import { MailService } from '../mail/mail.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateInvitationBatchDto } from './dto/create-invitation-batch.dto';
import { paginate } from '../../common/dto/pagination-query.dto';

const INVITATION_EXPIRY_HOURS = 48;
const BATCH_MAX_TOTAL = 50;

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(ActivityInvitation)
    private readonly invitationRepository: Repository<ActivityInvitation>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityOpen)
    private readonly activityOpenRepository: Repository<ActivityOpen>,
    @InjectRepository(ActivityParticipation)
    private readonly participationRepository: Repository<ActivityParticipation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(ExternalContact)
    private readonly externalContactRepository: Repository<ExternalContact>,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async create(activityId: string, dto: CreateInvitationDto, hostUser: User) {
    if (!dto.userId && !dto.externalContactId) {
      throw new BadRequestException(
        'Either userId or externalContactId must be provided',
      );
    }

    if (dto.userId && dto.externalContactId) {
      throw new BadRequestException(
        'Only one of userId or externalContactId can be provided',
      );
    }

    await this.assertHost(activityId, hostUser.id);

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

    const pendingCount = await this.invitationRepository.count({
      where: { activityId, status: 'pending' },
    });

    if (activeCount + pendingCount >= activity.activityOpen.maxParticipants) {
      throw new BadRequestException(
        'Activity has reached the maximum number of participants (including pending invitations)',
      );
    }

    // ── Resolve target and validate ───────────────────────────────────────────

    let targetEmail: string;
    let invitedUserId: string | null = null;
    let invitedExternalContactId: string | null = null;

    if (dto.userId) {
      const invitedUser = await this.userRepository.findOne({
        where: { id: dto.userId },
      });

      if (!invitedUser) {
        throw new NotFoundException('User not found');
      }

      if (invitedUser.id === hostUser.id) {
        throw new BadRequestException('You cannot invite yourself');
      }

      const alreadyParticipating = await this.participationRepository.findOne({
        where: { activityId, userId: invitedUser.id, status: 'active' },
      });

      if (alreadyParticipating) {
        throw new BadRequestException(
          'This user is already an active participant in this activity',
        );
      }

      const existingPending = await this.invitationRepository.findOne({
        where: { activityId, userId: invitedUser.id, status: 'pending' },
      });

      if (existingPending) {
        throw new BadRequestException(
          'A pending invitation already exists for this user in this activity',
        );
      }

      targetEmail = invitedUser.email;
      invitedUserId = invitedUser.id;
    } else {
      const contact = await this.externalContactRepository.findOne({
        where: { id: dto.externalContactId!, ownerUserId: hostUser.id },
      });

      if (!contact) {
        throw new NotFoundException(
          'External contact not found or does not belong to you',
        );
      }

      if (!contact.email) {
        throw new BadRequestException(
          'This external contact does not have an email address',
        );
      }

      const alreadyParticipating = await this.participationRepository.findOne({
        where: {
          activityId,
          externalContactId: contact.id,
          status: 'active',
        },
      });

      if (alreadyParticipating) {
        throw new BadRequestException(
          'This external contact is already an active participant in this activity',
        );
      }

      const existingPending = await this.invitationRepository.findOne({
        where: {
          activityId,
          externalContactId: contact.id,
          status: 'pending',
        },
      });

      if (existingPending) {
        throw new BadRequestException(
          'A pending invitation already exists for this external contact in this activity',
        );
      }

      targetEmail = contact.email;
      invitedExternalContactId = contact.id;
    }

    // ── Create and send invitation ────────────────────────────────────────────

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);

    const invitation = this.invitationRepository.create({
      activityId,
      invitedByUserId: hostUser.id,
      userId: invitedUserId,
      externalContactId: invitedExternalContactId,
      email: targetEmail,
      token,
      status: 'pending',
      expiresAt,
      respondedAt: null,
    });

    const saved = await this.invitationRepository.save(invitation);

    await this.mailService.sendActivityInvitation({
      to: targetEmail,
      invitedByEmail: hostUser.email,
      activityTitle: activity.title,
      activityStartAt: activity.startAt,
      locationText: activity.activityOpen.locationText,
      token,
    });

    return {
      id: saved.id,
      email: saved.email,
      userId: saved.userId,
      externalContactId: saved.externalContactId,
      status: saved.status,
      expiresAt: saved.expiresAt,
    };
  }

  async createBatch(
    activityId: string,
    dto: CreateInvitationBatchDto,
    hostUser: User,
  ) {
    const userIds = [...new Set(dto.userIds ?? [])];
    const externalContactIds = [...new Set(dto.externalContactIds ?? [])];

    if (userIds.length === 0 && externalContactIds.length === 0) {
      throw new BadRequestException(
        'Provide at least one userId or externalContactId',
      );
    }

    const total = userIds.length + externalContactIds.length;
    if (total > BATCH_MAX_TOTAL) {
      throw new BadRequestException(
        `Cannot invite more than ${BATCH_MAX_TOTAL} recipients at once`,
      );
    }

    await this.assertHost(activityId, hostUser.id);

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

    const pendingCount = await this.invitationRepository.count({
      where: { activityId, status: 'pending' },
    });

    const targets: { email: string; userId?: string; externalContactId?: string }[] = [];
    const failed: { userId?: string; externalContactId?: string; reason: string }[] = [];

    // ── Validate users ────────────────────────────────────────────────────────

    for (const userId of userIds) {
      if (userId === hostUser.id) {
        failed.push({ userId, reason: 'You cannot invite yourself' });
        continue;
      }

      const invitedUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!invitedUser) {
        failed.push({ userId, reason: 'User not found' });
        continue;
      }

      const alreadyParticipating = await this.participationRepository.findOne({
        where: { activityId, userId, status: 'active' },
      });
      if (alreadyParticipating) {
        failed.push({ userId, reason: 'Already an active participant' });
        continue;
      }

      const existingPending = await this.invitationRepository.findOne({
        where: { activityId, userId, status: 'pending' },
      });
      if (existingPending) {
        failed.push({ userId, reason: 'Pending invitation already exists' });
        continue;
      }

      targets.push({ email: invitedUser.email, userId });
    }

    // ── Validate external contacts ─────────────────────────────────────────────

    for (const externalContactId of externalContactIds) {
      const contact = await this.externalContactRepository.findOne({
        where: { id: externalContactId, ownerUserId: hostUser.id },
      });

      if (!contact) {
        failed.push({
          externalContactId,
          reason: 'Contact not found or does not belong to you',
        });
        continue;
      }

      if (!contact.email) {
        failed.push({
          externalContactId,
          reason: 'Contact has no email address',
        });
        continue;
      }

      const alreadyParticipating = await this.participationRepository.findOne({
        where: {
          activityId,
          externalContactId,
          status: 'active',
        },
      });
      if (alreadyParticipating) {
        failed.push({
          externalContactId,
          reason: 'Already an active participant',
        });
        continue;
      }

      const existingPending = await this.invitationRepository.findOne({
        where: {
          activityId,
          externalContactId,
          status: 'pending',
        },
      });
      if (existingPending) {
        failed.push({
          externalContactId,
          reason: 'Pending invitation already exists',
        });
        continue;
      }

      targets.push({
        email: contact.email,
        externalContactId,
      });
    }

    if (targets.length === 0) {
      return {
        created: [],
        failed,
        message: 'No invitations were sent. All targets were invalid or already invited.',
      };
    }

    if (activeCount + pendingCount + targets.length > activity.activityOpen.maxParticipants) {
      throw new BadRequestException(
        `Activity has reached the maximum number of participants. ` +
          `You can invite at most ${activity.activityOpen.maxParticipants - activeCount - pendingCount} more.`,
      );
    }

    // ── Create invitations and send emails ─────────────────────────────────────

    const created: { id: string; email: string; userId?: string; externalContactId?: string; status: string; expiresAt: Date }[] = [];
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);

    for (const target of targets) {
      const token = uuidv4();
      const invitation = this.invitationRepository.create({
        activityId,
        invitedByUserId: hostUser.id,
        userId: target.userId ?? null,
        externalContactId: target.externalContactId ?? null,
        email: target.email,
        token,
        status: 'pending',
        expiresAt,
        respondedAt: null,
      });
      const saved = await this.invitationRepository.save(invitation);

      await this.mailService.sendActivityInvitation({
        to: target.email,
        invitedByEmail: hostUser.email,
        activityTitle: activity.title,
        activityStartAt: activity.startAt,
        locationText: activity.activityOpen.locationText,
        token,
      });

      created.push({
        id: saved.id,
        email: saved.email,
        userId: saved.userId ?? undefined,
        externalContactId: saved.externalContactId ?? undefined,
        status: saved.status,
        expiresAt: saved.expiresAt,
      });
    }

    return {
      created,
      failed,
      message: `Sent ${created.length} invitation(s)${failed.length > 0 ? `. ${failed.length} target(s) skipped.` : ''}`,
    };
  }

  async findReceivedInvitations(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status: 'pending' | 'accepted' | 'past' | 'expired' | 'all' = 'all',
  ) {
    const baseWhere: { userId: string; status?: InvitationStatus } = {
      userId,
    };
    if (status === 'pending') baseWhere.status = 'pending';
    else if (status === 'accepted') baseWhere.status = 'accepted';
    else if (status === 'expired') baseWhere.status = 'expired';

    let invitations: ActivityInvitation[];
    let total: number;

    if (status === 'past') {
      const qb = this.invitationRepository
        .createQueryBuilder('inv')
        .innerJoinAndSelect('inv.activity', 'a')
        .leftJoinAndSelect('a.activityOpen', 'ao')
        .innerJoinAndSelect('inv.invitedByUser', 'inviter')
        .where('inv.user_id = :userId', { userId })
        .andWhere('a.start_at < :now', { now: new Date() })
        .orderBy('inv.createdAt', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit);
      invitations = await qb.getMany();
      total = await this.invitationRepository
        .createQueryBuilder('inv')
        .innerJoin('inv.activity', 'a')
        .where('inv.user_id = :userId', { userId })
        .andWhere('a.start_at < :now', { now: new Date() })
        .getCount();
    } else {
      [invitations, total] = await this.invitationRepository.findAndCount({
        where: baseWhere,
        relations: ['activity', 'activity.activityOpen', 'invitedByUser'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const inviterUserIds = [...new Set(invitations.map((i) => i.invitedByUserId))];
    const inviterProfiles =
      inviterUserIds.length > 0
        ? await this.userProfileRepository.find({
            where: inviterUserIds.map((id) => ({ userId: id })),
          })
        : [];
    const profileByUserId = new Map(inviterProfiles.map((p) => [p.userId, p]));

    const data = invitations.map((inv) => {
      const profile = profileByUserId.get(inv.invitedByUserId);
      const displayName =
        profile && [profile.firstName, profile.lastName].filter(Boolean).length > 0
          ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
          : profile?.username ?? inv.invitedByUser?.email ?? null;

      return {
        id: inv.id,
        token: inv.token,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        respondedAt: inv.respondedAt,
        activity: inv.activity
          ? {
              id: inv.activity.id,
              title: inv.activity.title,
              startAt: inv.activity.startAt,
              endAt: inv.activity.endAt,
              status: inv.activity.status,
              sportName: inv.activity.activityOpen?.sportName ?? null,
              locationText: inv.activity.activityOpen?.locationText ?? null,
            }
          : null,
        inviter: {
          userId: inv.invitedByUserId,
          email: inv.invitedByUser?.email ?? null,
          displayName,
        },
      };
    });

    return paginate(data, total, page, limit);
  }

  async findAllByActivity(
    activityId: string,
    user: User,
    page: number = 1,
    limit: number = 10,
    status: 'pending' | 'accepted' | 'cancelled' | 'all' = 'all',
  ) {
    await this.assertHost(activityId, user.id);

    const where: { activityId: string; status?: 'pending' | 'accepted' | 'cancelled' } = {
      activityId,
    };
    if (status !== 'all') {
      where.status = status;
    }

    const [invitations, total] = await this.invitationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      userId: inv.userId,
      externalContactId: inv.externalContactId,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      respondedAt: inv.respondedAt,
    }));

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async preview(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['activity', 'activity.activityOpen', 'invitedByUser'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation');
    }

    const inviterProfile = await this.userProfileRepository.findOne({
      where: { userId: invitation.invitedByUserId },
    });

    const displayName =
      inviterProfile &&
      [inviterProfile.firstName, inviterProfile.lastName].filter(Boolean).length > 0
        ? [inviterProfile.firstName, inviterProfile.lastName].filter(Boolean).join(' ')
        : inviterProfile?.username ?? invitation.invitedByUser?.email ?? null;

    const isExpired =
      invitation.status === 'pending' && invitation.expiresAt < new Date();
    const canAccept =
      invitation.status === 'pending' && !isExpired && invitation.activity?.status === 'open';

    return {
      activity: invitation.activity
        ? {
            id: invitation.activity.id,
            title: invitation.activity.title,
            startAt: invitation.activity.startAt,
            endAt: invitation.activity.endAt,
            locationText: invitation.activity.activityOpen?.locationText ?? null,
            sportName: invitation.activity.activityOpen?.sportName ?? null,
            status: invitation.activity.status,
          }
        : null,
      inviter: {
        displayName,
        email: invitation.invitedByUser?.email ?? null,
      },
      status: isExpired ? 'expired' : invitation.status,
      expiresAt: invitation.expiresAt,
      canAccept,
    };
  }

  async accept(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['activity', 'activity.activityOpen'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation');
    }

    if (invitation.status !== 'pending') {
      const messages: Record<string, string> = {
        accepted: 'This invitation has already been accepted',
        rejected: 'This invitation has been rejected',
        cancelled: 'This invitation has been cancelled',
        expired: 'This invitation has expired',
      };
      throw new BadRequestException(
        messages[invitation.status] ?? 'Invitation is no longer valid',
      );
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    const activity = invitation.activity;

    if (!activity || activity.status !== 'open') {
      throw new BadRequestException('Activity is no longer open');
    }

    const now = new Date();
    if (activity.endAt && activity.endAt < now) {
      throw new BadRequestException('Activity has already ended');
    }

    const activeCount = await this.participationRepository.count({
      where: { activityId: activity.id, status: 'active' },
    });

    if (activeCount >= activity.activityOpen.maxParticipants) {
      throw new BadRequestException(
        'Activity has reached the maximum number of participants',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      // Always one of userId or externalContactId is set — never both null.
      const existing = await manager.findOne(ActivityParticipation, {
        where: invitation.userId
          ? { activityId: activity.id, userId: invitation.userId }
          : { activityId: activity.id, externalContactId: invitation.externalContactId! },
      });

      if (existing && existing.status === 'active') {
        throw new BadRequestException(
          'This invitee is already an active participant in this activity',
        );
      }

      if (existing) {
        existing.status = 'active';
        existing.role = 'participant';
        existing.joinedAt = new Date();
        await manager.save(existing);
      } else {
        const participation = manager.create(ActivityParticipation, {
          activityId: activity.id,
          userId: invitation.userId,
          externalContactId: invitation.externalContactId,
          role: 'participant',
          status: 'active',
          joinedAt: new Date(),
        });
        await manager.save(participation);
      }

      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await manager.save(invitation);
    });

    const host = await this.participationRepository.findOne({
      where: { activityId: activity.id, role: 'host', status: 'active' },
      relations: ['user'],
    });

    if (host?.user?.email) {
      await this.mailService.sendInvitationAccepted({
        to: host.user.email,
        guestEmail: invitation.email,
        activityTitle: activity.title,
        activityStartAt: activity.startAt,
      });
    }

    return {
      message: 'You have joined the activity',
      activity: {
        id: activity.id,
        title: activity.title,
        startAt: activity.startAt,
        locationText: activity.activityOpen?.locationText ?? null,
      },
    };
  }

  async cancel(activityId: string, invitationId: string, user: User) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    assertActivityActive(activity);

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, activityId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found in this activity');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Cannot cancel an invitation with status '${invitation.status}'`,
      );
    }

    invitation.status = 'cancelled';
    await this.invitationRepository.save(invitation);

    return { message: 'Invitation cancelled' };
  }

  private async assertHost(activityId: string, userId: string): Promise<void> {
    const hostParticipation = await this.participationRepository.findOne({
      where: { activityId, userId, role: 'host', status: 'active' },
    });

    if (!hostParticipation) {
      throw new ForbiddenException(
        'You do not have permission to manage invitations for this activity',
      );
    }
  }
}
