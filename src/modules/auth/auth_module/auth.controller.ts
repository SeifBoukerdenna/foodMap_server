/* eslint-disable prettier/prettier */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
// src/modules/gpt/auth.controller.ts

import { Body, ConflictException, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto, UserDto } from 'src/modules/gpt/dto/auth-data.dto';
import { EmailAlreadyExistsError, RegisterErrors, UsernameAlreadyExistsError } from './auth.error';
import { AuthService } from './auth.service';
import { UserService } from 'src/modules/user/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
   constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

  @Post('register')
    @ApiOperation({
        summary: 'Register a new user',
        description: 'Creates a new user account with an email, username, and password.',
    })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered', type: UserDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or username already in use' })
    async register(@Body() credentials: RegisterDto) {
        try {
            const { email, username, password, displayName } = credentials;
            const usernameLowerCase = username.toLowerCase();
            const user = await this.authService.register(email, usernameLowerCase, password, displayName);
            return user;
        } catch (error) {
            if (error instanceof UsernameAlreadyExistsError) {
                throw new ConflictException({ code: RegisterErrors.UsernameAlreadyExists });
            } else if (error instanceof EmailAlreadyExistsError) {
                throw new ConflictException({ code: RegisterErrors.EmailAlreadyExists });
            }
        }
    }

}
