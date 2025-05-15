import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../../firebase/firebase.service';
import { Request } from 'express';

// Define JWT payload structure
interface JwtPayload {
  sub: string; // User ID
  username?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

// Define Firebase token structure without namespaces
interface FirebaseDecodedIdToken {
  uid: string;
  email?: string;
  [key: string]: unknown;
}

// Custom interface for request with user
interface RequestWithUser extends Request {
  user: JwtPayload | FirebaseDecodedIdToken;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // For Firebase auth
      if (token.startsWith('Firebase ')) {
        const firebaseToken = token.split('Firebase ')[1];
        const decodedToken =
          await this.firebaseService.verifyToken(firebaseToken);

        // Safe type casting with our custom interface
        (request as RequestWithUser).user =
          decodedToken as FirebaseDecodedIdToken;
        return true;
      }

      // For JWT auth
      const jwtSecret = this.configService.get<string>('jwt.secret');
      if (!jwtSecret) {
        throw new Error('JWT secret is not configured');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtSecret,
      });

      // Safe type casting with our custom interface
      (request as RequestWithUser).user = payload;
      return true;
    } catch (error) {
      if (error instanceof Error) {
        // Log the specific error for debugging
        console.error(`Authentication error: ${error.message}`);
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' || type === 'Firebase' ? token : undefined;
  }
}
