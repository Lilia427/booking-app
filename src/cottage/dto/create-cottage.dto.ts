import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateCottageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerNight: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuests: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
