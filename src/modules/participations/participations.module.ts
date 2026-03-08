import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ActivityInvitation } from '../invitations/entities/activity-invitation.entity';
import { ExternalContact } from '../external-contacts/entities/external-contact.entity';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityOpen,
      ActivityParticipation,
      ActivityInvitation,
      User,
      ExternalContact,
    ]),
  ],
  controllers: [ParticipationsController],
  providers: [ParticipationsService],
  exports: [ParticipationsService],
})
export class ParticipationsModule {}
