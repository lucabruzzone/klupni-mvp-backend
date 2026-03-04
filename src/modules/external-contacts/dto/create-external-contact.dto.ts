import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExternalContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  alias: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}
