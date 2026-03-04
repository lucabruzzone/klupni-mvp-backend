import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreateInvitationDto {
  @ValidateIf((o: CreateInvitationDto) => !o.externalContactId)
  @IsUUID()
  userId?: string;

  @ValidateIf((o: CreateInvitationDto) => !o.userId)
  @IsUUID()
  externalContactId?: string;
}
