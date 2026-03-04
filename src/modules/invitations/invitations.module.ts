import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailModule } from '../mail/mail.module';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { ExternalContactsModule } from '../external-contacts/external-contacts.module';
import { ActivityInvitation } from './entities/activity-invitation.entity';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityInvitation,
      Activity,
      ActivityOpen,
      ActivityParticipation,
      User,
      UserProfile,
    ]),
    ExternalContactsModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
