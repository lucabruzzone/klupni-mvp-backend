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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    return this.activitiesService.create(dto, user);
  }

  @Get()
  async findAll(
    @Query() query: ListActivitiesQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.activitiesService.findAll(query, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Get(':id/participants')
  async listParticipants(
    @Param('id') id: string,
    @Query() query: ListParticipantsQueryDto,
  ) {
    return this.activitiesService.listParticipants(id, query);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: User,
  ) {
    return this.activitiesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.activitiesService.remove(id, user);
  }
}
