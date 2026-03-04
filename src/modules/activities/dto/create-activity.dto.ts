import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
class IsFutureDate implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return new Date(value) > new Date();
  }
  defaultMessage(): string {
    return 'startAt must be a future date';
  }
}

@ValidatorConstraint({ name: 'isAfterStartAt', async: false })
class IsAfterStartAt implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateActivityDto;
    if (!obj.startAt) return true;
    return new Date(value) > new Date(obj.startAt);
  }
  defaultMessage(): string {
    return 'endAt must be after startAt';
  }
}

@ValidatorConstraint({ name: 'minLteMax', async: false })
class MinLteMax implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    const obj = args.object as CreateActivityDto;
    if (!obj.maxParticipants) return true;
    return value <= obj.maxParticipants;
  }
  defaultMessage(): string {
    return 'minParticipants must be less than or equal to maxParticipants';
  }
}

export class CreateActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  @Validate(IsFutureDate)
  startAt: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsAfterStartAt)
  endAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sportName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationText?: string;

  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants: number;

  @IsInt()
  @Min(1)
  @Validate(MinLteMax)
  minParticipants: number;
}
