import { IsIn } from 'class-validator';
import type { ParticipationRole } from '../../activities/entities/activity-participation.entity';

export class UpdateRoleDto {
  @IsIn(['host', 'participant'])
  role: ParticipationRole;
}
