// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
