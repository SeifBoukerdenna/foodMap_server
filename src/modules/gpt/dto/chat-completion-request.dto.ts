// src/modules/gpt/dto/chat-completion-request.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MessageDto } from './message.dto';

/**
 * Request DTO for chat completions
 */
export class ChatCompletionRequestDto {
  @ApiProperty({
    description: 'Array of messages in the conversation',
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiPropertyOptional({
    description: 'The model to use for completion',
    example: 'gpt-4',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'The sampling temperature (0-2)',
    example: 0.7,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'The maximum number of tokens to generate',
    example: 500,
  })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional({
    description: 'The top-p sampling (0-1)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  topP?: number;

  @ApiPropertyOptional({
    description: 'The frequency penalty (0-2)',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  frequencyPenalty?: number;

  @ApiPropertyOptional({
    description: 'The presence penalty (0-2)',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  presencePenalty?: number;
}
