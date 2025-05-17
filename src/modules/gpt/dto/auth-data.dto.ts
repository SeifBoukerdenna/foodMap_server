// src/modules/auth/dto/auth-data.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class UserDto {
  @ApiProperty()
  @IsString()
  uid: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  avatar: string;

  @ApiProperty()
  @IsString()
  email: string;
}

/**
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Unique username chosen by the user',
    example: 'sakdoumz123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'sakdoumz123@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'Sakdoumz123*',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @ApiProperty({
    description: 'Public display name of the user',
    example: 'Sak Doumz',
  })
  @IsString()
  displayName: string;
}

// Login DTO
export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

// Verify Token DTO
export class VerifyTokenDto {
  @ApiProperty({
    description: 'Firebase ID Token',
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFmODhiODE0MjljYzQ1MWEzMzVjMmY1Y2RiM2RmYjM0ZWIzYmJjN2YiLCJ0eXAiOiJKV1QifQ...',
  })
  @IsString()
  token: string;
}

// Auth Response DTO
export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication token',
  })
  token: string;

  @ApiProperty({
    description: 'User data',
    type: UserDto,
  })
  user: UserDto;
}
