// src/modules/gpt/auth.controller.ts

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  RegisterDto,
  UserDto,
  LoginDto,
  VerifyTokenDto,
  AuthResponseDto,
  VerifyEmailDto,
  VerificationStatusDto,
} from 'src/modules/gpt/dto/auth-data.dto';
import {
  EmailAlreadyExistsError,
  RegisterErrors,
  UsernameAlreadyExistsError,
  InvalidCredentialsError,
} from './auth.error';
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
    description:
      'Creates a new user account with an email, username, and password.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already in use',
  })
  async register(@Body() credentials: RegisterDto) {
    try {
      const { email, username, password, displayName } = credentials;
      const usernameLowerCase = username.toLowerCase();
      const user = await this.authService.register(
        email,
        usernameLowerCase,
        password,
        displayName,
      );
      return user;
    } catch (error) {
      if (error instanceof UsernameAlreadyExistsError) {
        throw new ConflictException({
          code: RegisterErrors.UsernameAlreadyExists,
        });
      } else if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException({
          code: RegisterErrors.EmailAlreadyExists,
        });
      }
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login a user',
    description: 'Authenticates a user with email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() credentials: LoginDto) {
    try {
      const { email } = credentials;
      return await this.authService.login(email);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw error;
    }
  }

  @Post('verify-token')
  @ApiOperation({
    summary: 'Verify Firebase ID token',
    description: 'Verifies a Firebase ID token and returns user data',
  })
  @ApiBody({ type: VerifyTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully verified',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  async verifyToken(@Body() tokenData: VerifyTokenDto) {
    try {
      const { token } = tokenData;
      return await this.authService.verifyToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token ', error as string);
    }
  }

  @Post('send-verification-email')
  @ApiOperation({
    summary: 'Send verification email',
    description: 'Sends a verification email to the user',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User not found or email already verified',
  })
  async sendVerificationEmail(@Body() data: VerifyEmailDto) {
    try {
      return await this.authService.sendVerificationEmail(data.email);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('verify-email-status')
  @ApiOperation({
    summary: 'Check email verification status',
    description: "Checks if a user's email is verified",
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns verification status',
    type: VerificationStatusDto,
  })
  async verifyEmailStatus(@Body() data: VerifyEmailDto) {
    try {
      return await this.authService.checkEmailVerificationStatus(data.email);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
