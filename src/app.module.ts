// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

// Import modules
import { GptModule } from './modules/gpt/gpt.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration module with relaxed validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        // Only require OPENAI_API_KEY, make everything else optional
        OPENAI_API_KEY: Joi.string().required(),
        // Optional configurations
        DATABASE_URL: Joi.string().optional(),
        REDIS_URL: Joi.string().optional(),
        JWT_SECRET: Joi.string().optional(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
        GOOGLE_MAPS_API_KEY: Joi.string().optional(),
        FIREBASE_PROJECT_ID: Joi.string().optional(),
        FIREBASE_PRIVATE_KEY: Joi.string().optional(),
        FIREBASE_CLIENT_EMAIL: Joi.string().optional(),
        // Authentication bypass flag
        DISABLE_AUTH: Joi.boolean().default(true),
      }),
    }),

    // Rate limiting with relaxed configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Feature modules
    GptModule,
  ],
})
export class AppModule {}
