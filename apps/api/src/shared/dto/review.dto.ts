import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateReviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  authorName!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  authorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  siteId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}