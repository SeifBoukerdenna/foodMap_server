// src/modules/auth/gards/simple-auth.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseService } from 'src/modules/firebase/firebase.service';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if auth is disabled in config (for local development)
    const authDisabled = this.configService.get<boolean>('auth.disabled');
    if (authDisabled) {
      console.log('⚠️ Authentication is DISABLED. For development only!');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Just verify token with Firebase Auth - don't fetch Firestore data
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      // Add user info to request
      request['user'] = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        // Add any other properties you need from the token
      };

      // Log successful authentication
      console.log(`✅ User ${decodedToken.uid} authenticated successfully`);

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Authentication error:', errorMsg);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
