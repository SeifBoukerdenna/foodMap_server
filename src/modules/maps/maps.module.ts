// src/modules/maps/maps.module.ts

import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { AuthModule } from '../auth/auth_module/auth.module';
import { AppCheckModule } from '../app-check/app-check.module';

@Module({
  imports: [AuthModule, AppCheckModule],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
