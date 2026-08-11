import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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

  /**
   * A root-relative path inside /uploads/hero-slides/ (no `..` traversal) or an
   * absolute http(s) URL. Anything else is rejected — an attacker-controlled
   * imageUrl is used in filesystem cleanup (unlinkSync), so it must never be
   * able to escape the uploads directory.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^(\/uploads\/hero-slides\/[a-zA-Z0-9._-]+|https?:\/\/[^\s]+)$/, {
    message:
      'imageUrl must be an absolute URL or a path inside /uploads/hero-slides/ (e.g. /uploads/hero-slides/banner.png)',
  })
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
