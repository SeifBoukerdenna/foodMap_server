import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../firebase/firebase.module';
import { AppCheckGuard } from './app-check.guard';

@Global()
@Module({
  imports: [FirebaseModule, ConfigModule],
  providers: [AppCheckGuard],
  exports: [AppCheckGuard],
})
export class AppCheckModule {}
