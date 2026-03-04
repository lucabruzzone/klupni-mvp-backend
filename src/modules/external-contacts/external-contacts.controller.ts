import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ExternalContactsService } from './external-contacts.service';
import { CreateExternalContactDto } from './dto/create-external-contact.dto';
import { ListExternalContactsQueryDto } from './dto/list-external-contacts-query.dto';
import { UpdateExternalContactDto } from './dto/update-external-contact.dto';

@Controller('external-contacts')
export class ExternalContactsController {
  constructor(
    private readonly externalContactsService: ExternalContactsService,
  ) {}

  @Get()
  async findAll(
    @Query() query: ListExternalContactsQueryDto,
    @CurrentUser() user: User,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.externalContactsService.findAll(user, page, limit);
  }

  @Post()
  async create(
    @Body() dto: CreateExternalContactDto,
    @CurrentUser() user: User,
  ) {
    return this.externalContactsService.create(dto, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.externalContactsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExternalContactDto,
    @CurrentUser() user: User,
  ) {
    return this.externalContactsService.update(id, dto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.externalContactsService.remove(id, user);
  }
}
