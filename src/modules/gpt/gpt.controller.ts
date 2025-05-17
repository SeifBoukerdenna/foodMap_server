// src/modules/gpt/gpt.controller.ts

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GptService } from './gpt.service';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { RestaurantSuggestionsRequestDto } from './dto/restaurant-suggestions-request.dto';
import { AuthGuard } from '../auth/gards/auth.guard';

@ApiTags('gpt')
@Controller('gpt')
@UseGuards(AuthGuard) // Add this line to protect all routes
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Get a chat completion from GPT' })
  @ApiResponse({
    status: 200,
    description: 'The chat completion response',
  })
  async getChatCompletion(@Body() chatRequest: ChatCompletionRequestDto) {
    return this.gptService.getChatCompletion(chatRequest);
  }

  @Post('restaurant-suggestions')
  @ApiOperation({ summary: 'Get restaurant suggestions from GPT' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant suggestions from the AI penguin mascot',
  })
  async getRestaurantSuggestions(
    @Body() request: RestaurantSuggestionsRequestDto,
  ) {
    return this.gptService.getRestaurantSuggestions(
      request.userId || 'anonymous-user',
      request.preferences,
    );
  }
}
