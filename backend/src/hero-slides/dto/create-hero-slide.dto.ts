import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

function parseOptionalInt({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return value;
  return Number(value);
}

function parseOptionalBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return value;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

export class CreateHeroSlideDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  /** Multipart fields arrive as strings; these transforms coerce before validation. */
  @IsOptional()
  @Transform(parseOptionalInt)
  @IsInt()
  position?: number;

  @IsOptional()
  @Transform(parseOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;
}
