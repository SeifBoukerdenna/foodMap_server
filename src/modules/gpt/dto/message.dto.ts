// src/modules/gpt/dto/message.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

/**
 * Message DTO with strict role typing for OpenAI compatibility
 */
export class MessageDto {
  @ApiProperty({
    description: 'The role of the message author',
    enum: ['system', 'user', 'assistant'],
    example: 'user',
  })
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({
    description: 'The content of the message',
    example: 'What restaurants are good for vegetarians?',
  })
  @IsString()
  content: string;
}
