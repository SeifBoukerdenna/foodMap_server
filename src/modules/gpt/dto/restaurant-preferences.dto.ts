// src/modules/gpt/dto/restaurant-preferences.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Price range options for restaurant preferences
 */
export enum PriceRange {
  BUDGET = 'budget',
  MODERATE = 'moderate',
  EXPENSIVE = 'expensive',
  LUXURY = 'luxury',
}

/**
 * DTO for restaurant preferences
 */
export class RestaurantPreferencesDto {
  @ApiPropertyOptional({
    description: 'Type of cuisine preferred',
    example: 'Italian',
  })
  @IsString()
  @IsOptional()
  cuisine?: string;

  @ApiPropertyOptional({
    description: 'Dietary restrictions or preferences',
    example: ['vegetarian', 'gluten-free'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dietary?: string[];

  @ApiPropertyOptional({
    description: 'Preferred price range',
    enum: PriceRange,
    example: PriceRange.MODERATE,
  })
  @IsEnum(PriceRange)
  @IsOptional()
  priceRange?: PriceRange;

  @ApiPropertyOptional({
    description: 'Preferred location or neighborhood',
    example: 'Downtown',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Any other preferences',
    example: { quietEnvironment: true, outdoorSeating: true },
  })
  @IsOptional()
  additionalPreferences?: Record<string, unknown>;
}
