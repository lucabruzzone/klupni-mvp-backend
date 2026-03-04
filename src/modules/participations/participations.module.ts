import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Activity } from '../activities/entities/activity.entity';
import { ActivityOpen } from '../activities/entities/activity-open.entity';
import { ActivityParticipation } from '../activities/entities/activity-participation.entity';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityOpen,
      ActivityParticipation,
    ]),
  ],
  controllers: [ParticipationsController],
  providers: [ParticipationsService],
  exports: [ParticipationsService],
})
export class ParticipationsModule {}
