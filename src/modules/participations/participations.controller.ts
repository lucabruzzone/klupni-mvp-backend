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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ParticipationsService } from './participations.service';
import { AddFreeParticipantDto } from './dto/add-free-participant.dto';
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
    return this.participationsService.addFreeParticipant(activityId, dto, user);
  }

  @Patch(':participationId/role')
  async updateRole(
    @Param('activityId') activityId: string,
    @Param('participationId') participationId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.participationsService.updateRole(
      activityId,
      participationId,
      dto,
      user,
    );
  }

  @Patch(':participationId/remove')
  @HttpCode(HttpStatus.OK)
  async removeParticipant(
    @Param('activityId') activityId: string,
    @Param('participationId') participationId: string,
    @CurrentUser() user: User,
  ) {
    return this.participationsService.removeParticipant(
      activityId,
      participationId,
      user,
    );
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async leaveActivity(
    @Param('activityId') activityId: string,
    @CurrentUser() user: User,
  ) {
    return this.participationsService.leaveActivity(activityId, user);
  }
}
