// src/modules/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseModule } from '../../firebase/firebase.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../gards/auth.guard';
import { UserModule } from 'src/modules/user/user.module';

@Global() // Make it global to share providers
@Module({
  imports: [
    FirebaseModule,
    ConfigModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.secret') ||
          'dev-secret-key-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1d',
          algorithm: 'HS256',
        },
        verifyOptions: {
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule, FirebaseModule], // Export FirebaseModule too
})
export class AuthModule {}
