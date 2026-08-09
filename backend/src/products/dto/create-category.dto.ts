import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(['MEN', 'WOMEN', 'ACCESSORIES'])
  collection?: 'MEN' | 'WOMEN' | 'ACCESSORIES';
}
