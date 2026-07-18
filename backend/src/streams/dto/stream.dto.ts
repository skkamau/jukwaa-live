import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const normalizeTags = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? [...new Set(value.map((tag) => (typeof tag === 'string' ? tag.trim() : tag)))].filter(Boolean)
    : value;

export class PrepareStreamDto {
  @Transform(trim)
  @IsString()
  @Length(3, 140)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Transform(trim)
  @IsString()
  @Length(1, 80)
  category: string;

  @Transform(trim)
  @IsString()
  @Length(2, 40)
  language: string;

  @Transform(normalizeTags)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags: string[];

  @IsBoolean()
  matureContent: boolean;
}

export class UpdateStreamDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(3, 140)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  category?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 40)
  language?: string;

  @IsOptional()
  @Transform(normalizeTags)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  matureContent?: boolean;
}
