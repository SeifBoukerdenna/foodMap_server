// src/modules/user/user.controller.ts

import { Body, Controller, Post, UseGuards, Get, Param } from '@nestjs/common';
import { SimpleAuthGuard } from '../auth/gards/auth.guard';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('user')
@Controller('user')
@UseGuards(SimpleAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('update-username')
  @ApiOperation({ summary: "Update a user's username and display name" })
  @ApiResponse({
    status: 200,
    description: 'Username and display name updated successfully',
  })
  async updateUsername(
    @Body() updateData: { uid: string; username: string; displayName: string },
  ) {
    return this.userService.updateUsername(
      updateData.uid,
      updateData.username,
      updateData.displayName,
    );
  }

  @Post('delete-account')
  @ApiOperation({ summary: "Delete a user's account" })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  async deleteAccount(@Body() deleteData: { uid: string }) {
    return this.userService.deleteAccount(deleteData.uid);
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get user data by UID' })
  @ApiResponse({
    status: 200,
    description: 'The user data',
  })
  async getUserData(@Param('uid') uid: string) {
    return this.userService.getUserDataByUid(uid);
  }
}
