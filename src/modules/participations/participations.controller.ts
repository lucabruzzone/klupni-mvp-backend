import {
  Body,
  Controller,
  Delete,
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
import { ParticipationsService } from './participations.service';
import { AddFreeParticipantDto } from './dto/add-free-participant.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('activities/:activityId/participations')
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Post('free')
  async addFree(
    @Param('activityId') activityId: string,
    @Body() dto: AddFreeParticipantDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.participationsService.addFreeParticipant(
      activityId,
      dto,
      user,
    );
    return ResponseFactory.created(ApiCodes.PARTICIPANT_ADDED, result);
  }

  @Post()
  async addParticipant(
    @Param('activityId') activityId: string,
    @Body() dto: AddParticipantDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.participationsService.addParticipant(
      activityId,
      dto,
      user,
    );
    return ResponseFactory.created(ApiCodes.PARTICIPANT_ADDED, result);
  }

  @Patch(':participationId/role')
  async updateRole(
    @Param('activityId') activityId: string,
    @Param('participationId') participationId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.participationsService.updateRole(
      activityId,
      participationId,
      dto,
      user,
    );
    return ResponseFactory.ok(ApiCodes.PARTICIPANT_ROLE_UPDATED, result);
  }

  @Patch(':participationId/remove')
  @HttpCode(HttpStatus.OK)
  async removeParticipant(
    @Param('activityId') activityId: string,
    @Param('participationId') participationId: string,
    @CurrentUser() user: User,
  ) {
    await this.participationsService.removeParticipant(
      activityId,
      participationId,
      user,
    );
    return ResponseFactory.ok(ApiCodes.PARTICIPANT_REMOVED);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async leaveActivity(
    @Param('activityId') activityId: string,
    @CurrentUser() user: User,
  ) {
    await this.participationsService.leaveActivity(activityId, user);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_LEFT);
  }
}
