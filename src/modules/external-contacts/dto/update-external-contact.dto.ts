import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateExternalContactDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  alias?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}
