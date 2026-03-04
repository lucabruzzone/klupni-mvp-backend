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

import { ApiCodes } from '../../common/constants/api-codes';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
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
    const result = await this.invitationsService.create(activityId, dto, user);
    return ResponseFactory.created(ApiCodes.INVITATION_CREATED, result);
  }

  @Post('activities/:activityId/invitations/batch')
  async createBatch(
    @Param('activityId') activityId: string,
    @Body() dto: CreateInvitationBatchDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.invitationsService.createBatch(activityId, dto, user);
    return ResponseFactory.ok(ApiCodes.INVITATION_BATCH_CREATED, result);
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
    const result = await this.invitationsService.findAllByActivity(
      activityId,
      user,
      page,
      limit,
      status,
    );
    return ResponseFactory.paginated(
      ApiCodes.INVITATION_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Get('invitations/received')
  async findReceived(
    @Query() query: ListReceivedInvitationsQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';
    const result = await this.invitationsService.findReceivedInvitations(
      user.id,
      page,
      limit,
      status,
    );
    return ResponseFactory.paginated(
      ApiCodes.INVITATION_RECEIVED_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Public()
  @Get('invitations/preview')
  async preview(@Query('token') token: string) {
    const result = await this.invitationsService.preview(token);
    return ResponseFactory.ok(ApiCodes.INVITATION_PREVIEW_RETRIEVED, result);
  }

  @Public()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async accept(@Query('token') token: string) {
    const result = await this.invitationsService.accept(token);
    return ResponseFactory.ok(ApiCodes.INVITATION_ACCEPTED, result);
  }

  @Post('activities/:activityId/invitations/:invitationId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('activityId') activityId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: User,
  ) {
    await this.invitationsService.cancel(activityId, invitationId, user);
    return ResponseFactory.ok(ApiCodes.INVITATION_CANCELLED);
  }
}
