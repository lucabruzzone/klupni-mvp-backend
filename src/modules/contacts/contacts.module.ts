import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Contact } from './entities/contact.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ExternalContact } from '../external-contacts/entities/external-contact.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, ExternalContact, UserProfile]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService, TypeOrmModule],
})
export class ContactsModule {}
