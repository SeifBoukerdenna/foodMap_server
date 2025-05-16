/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { MissingEnvironmentVariableError } from './config.error';

const DEFAULT_PORT = 9999;

@Injectable()
export class ConfigService {
    readonly port: number = this.get<number>('PORT', DEFAULT_PORT);

    constructor(private nestConfigService: NestConfigService) {}

    get<T>(key: string, defaultValue?: T): T {
        try {
            return this.nestConfigService.getOrThrow<T>(key);
        } catch {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new MissingEnvironmentVariableError(key);
        }
    }
}
