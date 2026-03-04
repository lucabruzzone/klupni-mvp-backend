import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateInvitationBatchDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  userIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  externalContactIds?: string[];
}
