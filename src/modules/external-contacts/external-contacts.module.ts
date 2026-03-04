import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExternalContact } from './entities/external-contact.entity';
import { ExternalContactsController } from './external-contacts.controller';
import { ExternalContactsService } from './external-contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalContact])],
  controllers: [ExternalContactsController],
  providers: [ExternalContactsService],
  exports: [TypeOrmModule],
})
export class ExternalContactsModule {}
