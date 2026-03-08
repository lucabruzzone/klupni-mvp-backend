import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class AddParticipantDto {
  @ValidateIf((o) => !o.externalContactId)
  @IsUUID()
  userId?: string;

  @ValidateIf((o) => !o.userId)
  @IsUUID()
  externalContactId?: string;
}
