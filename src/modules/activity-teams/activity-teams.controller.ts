import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiCodes } from '../../common/constants/api-codes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
import { User } from '../auth/entities/user.entity';
import { ActivityTeamsService } from './activity-teams.service';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateActivityTeamDto } from './dto/create-activity-team.dto';
import { UpdateActivityTeamDto } from './dto/update-activity-team.dto';

@Controller('activities/:activityId/teams')
export class ActivityTeamsController {
  constructor(private readonly activityTeamsService: ActivityTeamsService) {}

  @Post()
  async create(
    @Param('activityId') activityId: string,
    @Body() dto: CreateActivityTeamDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.create(
      activityId,
      dto,
      user,
    );
    return ResponseFactory.created(ApiCodes.ACTIVITY_TEAM_CREATED, result);
  }

  @Get()
  async findAll(
    @Param('activityId') activityId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.findAll(activityId, user);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_TEAM_LIST_RETRIEVED, result);
  }

  @Get(':teamId/members')
  async findMembers(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.findMembers(
      activityId,
      teamId,
      user,
    );
    return ResponseFactory.ok(
      ApiCodes.ACTIVITY_TEAM_MEMBERS_LIST_RETRIEVED,
      result,
    );
  }

  @Get(':teamId')
  async findOne(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.findOne(
      activityId,
      teamId,
      user,
    );
    return ResponseFactory.ok(ApiCodes.ACTIVITY_TEAM_RETRIEVED, result);
  }

  @Patch(':teamId')
  async update(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateActivityTeamDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.update(
      activityId,
      teamId,
      dto,
      user,
    );
    return ResponseFactory.ok(ApiCodes.ACTIVITY_TEAM_UPDATED, result);
  }

  @Post(':teamId/members')
  async addMember(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.addMember(
      activityId,
      teamId,
      dto,
      user,
    );
    return ResponseFactory.created(
      ApiCodes.ACTIVITY_TEAM_MEMBER_ADDED,
      result,
    );
  }

  @Patch(':teamId/members/:memberId/captain')
  async setCaptain(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.activityTeamsService.setCaptain(
      activityId,
      teamId,
      memberId,
      user,
    );
    return ResponseFactory.ok(
      ApiCodes.ACTIVITY_TEAM_MEMBER_CAPTAIN_UPDATED,
      result,
    );
  }

  @Delete(':teamId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    await this.activityTeamsService.removeMember(
      activityId,
      teamId,
      memberId,
      user,
    );
    return ResponseFactory.ok(ApiCodes.ACTIVITY_TEAM_MEMBER_REMOVED);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('activityId') activityId: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: User,
  ) {
    await this.activityTeamsService.remove(activityId, teamId, user);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_TEAM_DELETED);
  }
}
