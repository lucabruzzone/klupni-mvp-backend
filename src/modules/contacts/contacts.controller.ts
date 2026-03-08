import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ApiCodes } from '../../common/constants/api-codes';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseFactory } from '../../common/factories/response.factory';
import { User } from '../auth/entities/user.entity';
import { ContactsService } from './contacts.service';
import { AddContactDto } from './dto/add-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { RemoveContactsBatchDto } from './dto/remove-contacts-batch.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async add(@Body() dto: AddContactDto, @CurrentUser() user: User) {
    const result = await this.contactsService.add(dto, user);
    return ResponseFactory.created(ApiCodes.CONTACT_ADDED, result);
  }

  @Get()
  async findAll(
    @Query() query: ListContactsQueryDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.contactsService.findAll(user, query);
    return ResponseFactory.paginated(
      ApiCodes.CONTACT_LIST_RETRIEVED,
      result.data,
      result.meta,
    );
  }

  @Delete('batch')
  async removeBatch(
    @Body() dto: RemoveContactsBatchDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.contactsService.removeBatch(dto, user);
    return ResponseFactory.ok(ApiCodes.CONTACT_BATCH_REMOVED, result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.contactsService.remove(id, user);
    return ResponseFactory.ok(ApiCodes.CONTACT_REMOVED);
  }
}
