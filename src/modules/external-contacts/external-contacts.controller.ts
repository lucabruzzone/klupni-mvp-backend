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

import { ApiCodes } from '../../common/constants/api-codes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
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
    const result = await this.externalContactsService.findAll(user, page, limit);
    return ResponseFactory.paginated(
      ApiCodes.EXTERNAL_CONTACT_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Post()
  async create(
    @Body() dto: CreateExternalContactDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.externalContactsService.create(dto, user);
    return ResponseFactory.created(ApiCodes.EXTERNAL_CONTACT_CREATED, result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.externalContactsService.findOne(id);
    return ResponseFactory.ok(ApiCodes.EXTERNAL_CONTACT_RETRIEVED, result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExternalContactDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.externalContactsService.update(id, dto, user);
    return ResponseFactory.ok(ApiCodes.EXTERNAL_CONTACT_UPDATED, result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.externalContactsService.remove(id, user);
    return ResponseFactory.ok(ApiCodes.EXTERNAL_CONTACT_DELETED);
  }
}
