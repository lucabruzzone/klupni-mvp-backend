import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './entities/activity.entity';
import { ActivityOpen } from './entities/activity-open.entity';
import { ActivityParticipation } from './entities/activity-participation.entity';
import { UserProfile } from '../auth/entities/user-profile.entity';
import { ActivityInvitation } from '../invitations/entities/activity-invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityOpen,
      ActivityParticipation,
      UserProfile,
      ActivityInvitation,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
