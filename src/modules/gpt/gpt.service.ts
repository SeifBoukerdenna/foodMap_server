/* eslint-disable prettier/prettier */
// src/modules/gpt/gpt.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionAssistantMessageParam,
} from 'openai/resources/chat';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { MessageDto } from './dto/message.dto';
import { RestaurantPreferencesDto } from './dto/restaurant-preferences.dto';

@Injectable()
export class GptService {
  private openai: OpenAI;
  private readonly logger = new Logger(GptService.name);

  constructor(private configService: ConfigService) {
    // Initialize OpenAI client with proper error handling
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Convert MessageDto objects to OpenAI's expected format
   */
  private convertToOpenAIMessages(
    messages: MessageDto[],
  ): ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      // Create the correct message type based on role
      if (msg.role === 'system') {
        return {
          role: 'system',
          content: msg.content,
        } as ChatCompletionSystemMessageParam;
      } else if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content,
        } as ChatCompletionUserMessageParam;
      } else {
        return {
          role: 'assistant',
          content: msg.content,
        } as ChatCompletionAssistantMessageParam;
      }
    });
  }

  /**
   * Get a chat completion from OpenAI GPT
   */
  async getChatCompletion(chatRequest: ChatCompletionRequestDto) {
    try {
      // Convert our DTOs to OpenAI's expected format
      const openaiMessages = this.convertToOpenAIMessages(chatRequest.messages);

      // Send request to OpenAI
      const completion = await this.openai.chat.completions.create({
        model: chatRequest.model || 'gpt-4',
        messages: openaiMessages,
        temperature: chatRequest.temperature || 0.7,
        max_tokens: chatRequest.maxTokens || 500,
        top_p: chatRequest.topP || 1,
        frequency_penalty: chatRequest.frequencyPenalty || 0,
        presence_penalty: chatRequest.presencePenalty || 0,
        stream: false,
      });

      return {
        id: completion.id,
        choices: completion.choices,
        usage: completion.usage,
      };
    } catch (error) {
      // Type-safe error handling
      const err = error as Error;
      this.logger.error(`Error calling OpenAI API: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Generate restaurant suggestions based on user preferences
   */
  async getRestaurantSuggestions(
    userId: string,
    preferences: RestaurantPreferencesDto,
  ) {
    // Create properly typed messages
    const systemMessage: MessageDto = {
      role: 'system',
      content:
        "You are FOODMAP's AI penguin mascot, providing helpful and friendly restaurant suggestions.",
    };

    const userMessage: MessageDto = {
      role: 'user',
      content: `Suggest restaurants for user ${userId} with these preferences: ${JSON.stringify(preferences)}`,
    };

    // Create a request object that matches our DTO structure
    const chatRequest: ChatCompletionRequestDto = {
      messages: [systemMessage, userMessage],
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 500,
    };

    return this.getChatCompletion(chatRequest);
  }
}
