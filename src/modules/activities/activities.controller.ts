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
  Query,
} from '@nestjs/common';

import { ApiCodes } from '../../common/constants/api-codes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
import { User } from '../auth/entities/user.entity';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() dto: CreateActivityDto, @CurrentUser() user: User) {
    const result = await this.activitiesService.create(dto, user);
    return ResponseFactory.created(ApiCodes.ACTIVITY_CREATED, result);
  }

  @Get()
  async findAll(
    @Query() query: ListActivitiesQueryDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.activitiesService.findAll(query, user);
    return ResponseFactory.paginated(
      ApiCodes.ACTIVITY_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.activitiesService.findOne(id);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_RETRIEVED, result);
  }

  @Get(':id/participants')
  async listParticipants(
    @Param('id') id: string,
    @Query() query: ListParticipantsQueryDto,
  ) {
    const result = await this.activitiesService.listParticipants(id, query);
    return ResponseFactory.paginated(
      ApiCodes.ACTIVITY_PARTICIPANTS_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.activitiesService.update(id, dto, user);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_UPDATED, result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.activitiesService.remove(id, user);
    return ResponseFactory.ok(ApiCodes.ACTIVITY_DELETED);
  }
}
