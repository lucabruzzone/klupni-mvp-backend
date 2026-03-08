import { HttpStatus, Injectable } from '@nestjs/common';
import { assertActivityActive } from '../../common/utils/activity.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ActivityTeam } from '../activities/entities/activity-team.entity';
import { ActivityTeamMember } from '../activities/entities/activity-team-member.entity';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateActivityTeamDto } from './dto/create-activity-team.dto';
import { UpdateActivityTeamDto } from './dto/update-activity-team.dto';
import { ApiCodes } from '../../common/constants/api-codes';
import { ApiException } from '../../common/exceptions/api.exception';

@Injectable()
export class ActivityTeamsService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityParticipation)
    private readonly participationRepository: Repository<ActivityParticipation>,
    @InjectRepository(ActivityTeam)
    private readonly teamRepository: Repository<ActivityTeam>,
    @InjectRepository(ActivityTeamMember)
    private readonly teamMemberRepository: Repository<ActivityTeamMember>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  async create(activityId: string, dto: CreateActivityTeamDto, user: User) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    assertActivityActive(activity);

    const team = this.teamRepository.create({
      activityId,
      name: dto.name,
      color: dto.color ?? null,
      photoUrl: dto.photoUrl ?? null,
      displayOrder: dto.displayOrder ?? null,
    });

    const saved = await this.teamRepository.save(team);

    return this.formatTeam(saved);
  }

  async findAll(activityId: string, user: User) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const teams = await this.teamRepository.find({
      where: { activityId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return teams.map((t) => this.formatTeam(t));
  }

  async findOne(activityId: string, teamId: string, user: User) {
    await this.assertHost(activityId, user.id);

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });

    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.formatTeam(team);
  }

  async findMembers(activityId: string, teamId: string, user: User) {
    await this.assertHost(activityId, user.id);

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });
    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const members = await this.teamMemberRepository.find({
      where: { teamId },
      relations: ['activityParticipation', 'activityParticipation.user', 'activityParticipation.externalContact'],
      order: { isCaptain: 'DESC', createdAt: 'ASC' },
    });

    const userIds = members
      .map((m) => m.activityParticipation?.userId)
      .filter((id): id is string => id != null);

    const profiles =
      userIds.length > 0
        ? await this.userProfileRepository.find({
            where: { userId: In(userIds) },
          })
        : [];
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return members.map((m) => {
      const p = m.activityParticipation;
      let displayName: string | null = null;
      let avatarUrl: string | null = null;
      let type: 'user' | 'external_contact' | 'free' = 'free';

      if (p?.userId) {
        type = 'user';
        const profile = profileMap.get(p.userId);
        displayName =
          [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
          profile?.username ||
          p.user?.email ||
          null;
        avatarUrl = profile?.avatarUrl ?? null;
      } else if (p?.externalContactId) {
        type = 'external_contact';
        displayName = p.externalContact?.alias ?? null;
      } else if (p?.alias) {
        displayName = p.alias;
      }

      return {
        id: m.id,
        teamId: m.teamId,
        activityParticipationId: m.activityParticipationId,
        isCaptain: m.isCaptain,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        participant: {
          type,
          displayName,
          avatarUrl,
          userId: p?.userId ?? null,
          externalContactId: p?.externalContactId ?? null,
        },
      };
    });
  }

  async update(
    activityId: string,
    teamId: string,
    dto: UpdateActivityTeamDto,
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

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });

    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.name !== undefined) team.name = dto.name;
    if (dto.color !== undefined) team.color = dto.color ?? null;
    if (dto.photoUrl !== undefined) team.photoUrl = dto.photoUrl ?? null;
    if (dto.displayOrder !== undefined)
      team.displayOrder = dto.displayOrder ?? null;

    const saved = await this.teamRepository.save(team);

    return this.formatTeam(saved);
  }

  async remove(activityId: string, teamId: string, user: User) {
    await this.assertHost(activityId, user.id);

    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    assertActivityActive(activity);

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });

    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.teamRepository.delete(teamId);

    return { message: 'Team deleted successfully' };
  }

  async addMember(
    activityId: string,
    teamId: string,
    dto: AddTeamMemberDto,
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

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });
    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const participation = await this.participationRepository.findOne({
      where: { id: dto.activityParticipationId, activityId, status: 'active' },
    });
    if (!participation) {
      throw new ApiException(
        ApiCodes.PARTICIPATION_NOT_IN_ACTIVITY,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingMember = await this.teamMemberRepository.findOne({
      where: { activityParticipationId: dto.activityParticipationId },
    });
    if (existingMember) {
      throw new ApiException(
        ApiCodes.PARTICIPATION_ALREADY_IN_TEAM,
        HttpStatus.CONFLICT,
      );
    }

    if (dto.isCaptain) {
      await this.teamMemberRepository.update(
        { teamId },
        { isCaptain: false },
      );
    }

    const member = this.teamMemberRepository.create({
      teamId,
      activityParticipationId: dto.activityParticipationId,
      isCaptain: dto.isCaptain ?? false,
    });
    const saved = await this.teamMemberRepository.save(member);

    return {
      id: saved.id,
      teamId: saved.teamId,
      activityParticipationId: saved.activityParticipationId,
      isCaptain: saved.isCaptain,
      createdAt: saved.createdAt,
    };
  }

  async removeMember(
    activityId: string,
    teamId: string,
    memberId: string,
    user: User,
  ) {
    await this.assertHost(activityId, user.id);

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });
    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const member = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
    });
    if (!member) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_MEMBER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.teamMemberRepository.delete(memberId);

    return { message: 'Member removed from team successfully' };
  }

  async setCaptain(
    activityId: string,
    teamId: string,
    memberId: string,
    user: User,
  ) {
    await this.assertHost(activityId, user.id);

    const team = await this.teamRepository.findOne({
      where: { id: teamId, activityId },
    });
    if (!team) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const member = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
    });
    if (!member) {
      throw new ApiException(
        ApiCodes.ACTIVITY_TEAM_MEMBER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.teamMemberRepository.update(
      { teamId, isCaptain: true },
      { isCaptain: false },
    );

    member.isCaptain = true;
    const saved = await this.teamMemberRepository.save(member);

    return {
      id: saved.id,
      teamId: saved.teamId,
      activityParticipationId: saved.activityParticipationId,
      isCaptain: saved.isCaptain,
      updatedAt: saved.updatedAt,
    };
  }

  private formatTeam(team: ActivityTeam) {
    return {
      id: team.id,
      activityId: team.activityId,
      name: team.name,
      color: team.color,
      photoUrl: team.photoUrl,
      displayOrder: team.displayOrder,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private async assertHost(activityId: string, userId: string): Promise<void> {
    const hostParticipation = await this.participationRepository.findOne({
      where: { activityId, userId, role: 'host', status: 'active' },
    });

    if (!hostParticipation) {
      throw new ApiException(
        ApiCodes.ACTIVITY_MODIFY_FORBIDDEN,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
