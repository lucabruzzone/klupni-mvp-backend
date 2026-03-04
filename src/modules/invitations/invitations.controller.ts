import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateInvitationBatchDto } from './dto/create-invitation-batch.dto';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto';
import { ListReceivedInvitationsQueryDto } from './dto/list-received-invitations-query.dto';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('activities/:activityId/invitations')
  async create(
    @Param('activityId') activityId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: User,
  ) {
    return this.invitationsService.create(activityId, dto, user);
  }

  @Post('activities/:activityId/invitations/batch')
  async createBatch(
    @Param('activityId') activityId: string,
    @Body() dto: CreateInvitationBatchDto,
    @CurrentUser() user: User,
  ) {
    return this.invitationsService.createBatch(activityId, dto, user);
  }

  @Get('activities/:activityId/invitations')
  async findAll(
    @Param('activityId') activityId: string,
    @Query() query: ListInvitationsQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';
    return this.invitationsService.findAllByActivity(activityId, user, page, limit, status);
  }

  @Get('invitations/received')
  async findReceived(
    @Query() query: ListReceivedInvitationsQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';
    return this.invitationsService.findReceivedInvitations(user.id, page, limit, status);
  }

  @Public()
  @Get('invitations/preview')
  async preview(@Query('token') token: string) {
    return this.invitationsService.preview(token);
  }

  @Public()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async accept(@Query('token') token: string) {
    return this.invitationsService.accept(token);
  }

  @Post('activities/:activityId/invitations/:invitationId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('activityId') activityId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: User,
  ) {
    return this.invitationsService.cancel(activityId, invitationId, user);
  }
}
