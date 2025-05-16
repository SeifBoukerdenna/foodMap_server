/* eslint-disable prettier/prettier */
// src/modules/auth/dto/register-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength} from 'class-validator';

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
