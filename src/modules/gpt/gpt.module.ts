// src/modules/gpt/gpt.module.ts

import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';
import { GptController } from './gpt.controller';

@Module({
  controllers: [GptController],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
