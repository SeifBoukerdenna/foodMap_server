import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Global()
@Module({
  imports: [FirebaseModule, NestConfigModule.forRoot({ isGlobal: true })],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
