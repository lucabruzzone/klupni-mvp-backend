import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserProfile } from '../auth/entities/user-profile.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ActivityTeam } from '../activities/entities/activity-team.entity';
import { ActivityTeamMember } from '../activities/entities/activity-team-member.entity';
import { ActivityTeamsController } from './activity-teams.controller';
import { ActivityTeamsService } from './activity-teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityParticipation,
      ActivityTeam,
      ActivityTeamMember,
      UserProfile,
    ]),
  ],
  controllers: [ActivityTeamsController],
  providers: [ActivityTeamsService],
  exports: [ActivityTeamsService],
})
export class ActivityTeamsModule {}
