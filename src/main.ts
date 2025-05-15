// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  // Create the app instance
  const app: INestApplication = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Configure logging
  });

  // Get config service
  const configService: ConfigService = app.get(ConfigService);

  // Global prefix for all endpoints
  app.setGlobalPrefix('api/v1');

  // Enable CORS - type-safe approach
  const corsOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Security middleware - type-safe approach
  app.use(helmet() as any); // Type cast necessary for compatibility

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation with proper typing
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FOODMAP API')
    .setDescription('The FOODMAP restaurant gamification API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Correct typing for Swagger
  const document: OpenAPIObject = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );
  SwaggerModule.setup('api/docs', app, document);

  // Start the application
  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`,
  );

  const authDisabled = configService.get<boolean>('auth.disabled');
  if (authDisabled) {
    console.log(
      '⚠️ Authentication is DISABLED. This should only be used for development!',
    );
  }
}

// Handle the promise returned by bootstrap
void bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
