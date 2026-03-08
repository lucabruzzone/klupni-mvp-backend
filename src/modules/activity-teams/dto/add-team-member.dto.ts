import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddTeamMemberDto {
  @IsUUID()
  activityParticipationId: string;

  @IsOptional()
  @IsBoolean()
  isCaptain?: boolean;
}
