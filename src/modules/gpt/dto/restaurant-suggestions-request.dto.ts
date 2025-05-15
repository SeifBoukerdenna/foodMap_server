// src/modules/gpt/dto/restaurant-suggestions-request.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RestaurantPreferencesDto } from './restaurant-preferences.dto';

/**
 * Request DTO for restaurant suggestions
 */
export class RestaurantSuggestionsRequestDto {
  @ApiPropertyOptional({
    description: 'User ID for personalized suggestions',
    example: 'user-123',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Restaurant preferences and criteria',
    type: RestaurantPreferencesDto,
  })
  @ValidateNested()
  @Type(() => RestaurantPreferencesDto)
  preferences: RestaurantPreferencesDto;
}
