import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddFreeParticipantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  alias: string;
}
