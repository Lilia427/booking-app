import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCottageDto } from './create-cottage.dto';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((item) => item.trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma-separated parsing.
    }

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export class UpdateCottageDto extends PartialType(CreateCottageDto) {
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  removeImageKeys?: string[];
}
