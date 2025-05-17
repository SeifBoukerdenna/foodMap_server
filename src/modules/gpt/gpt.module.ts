// src/modules/gpt/gpt.module.ts
import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';
import { GptController } from './gpt.controller';
import { AuthModule } from '../auth/auth_module/auth.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    AuthModule,
    FirebaseModule, // Import FirebaseModule directly
  ],
  controllers: [GptController],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
