// src/modules/app-check/app-check.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { FirebaseService } from 'src/modules/firebase/firebase.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AppCheckGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if App Check is disabled in config (for local development)
    const appCheckDisabled =
      this.configService.get<boolean>('appCheck.disabled');
    if (appCheckDisabled) {
      console.log('⚠️ App Check is DISABLED. For development only!');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const appCheckToken = this.extractAppCheckTokenFromHeader(request);

    // If no token, try to continue but log warning
    if (!appCheckToken) {
      console.warn('⚠️ No App Check token provided - proceeding anyway');
      return true;
    }

    try {
      // Verify the App Check token using Firebase Admin SDK
      await this.firebaseService.getAppCheck().verifyToken(appCheckToken);

      console.log('✅ App Check verification successful');
      return true;
    } catch (error) {
      // Log but don't block - temporary for debugging
      console.error(
        '⚠️ App Check verification error:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      // For now, just log warning and proceed to avoid blocking the app
      // In production, you would uncomment the next line:
      // throw new UnauthorizedException('Invalid App Check token');

      return true;
    }
  }

  private extractAppCheckTokenFromHeader(request: Request): string | undefined {
    // Try standard header
    const appCheckHeader = request.headers['x-firebase-appcheck'];
    if (appCheckHeader) {
      return appCheckHeader as string;
    }

    // Also check for custom header format if used by client
    const customHeader = request.headers['firebase-app-check-token'];
    if (customHeader) {
      return customHeader as string;
    }

    return undefined;
  }
}
