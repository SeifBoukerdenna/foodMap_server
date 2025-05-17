// src/modules/auth/auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  InvalidCredentialsError,
} from './auth.error';
import { UserService } from 'src/modules/user/user.service';
import { UserData } from 'src/modules/user/user';
import { FirebaseService } from 'src/modules/firebase/firebase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private firebase: FirebaseService,
    private userService: UserService,
  ) {}

  async register(
    email: string,
    username: string,
    password: string,
    displayName: string,
  ): Promise<UserData> {
    const usernameLowerCase = username.toLowerCase();

    if (await this.userService.isUsernameTaken(usernameLowerCase)) {
      throw new UsernameAlreadyExistsError();
    }

    if (await this.isEmailTaken(email)) {
      throw new EmailAlreadyExistsError();
    }

    const { uid } = await this.firebase
      .getAuth()
      .createUser({ email, displayName: usernameLowerCase, password });

    // Set user data based on the UID
    const userData = this.userService.createDefaultUserData(
      uid,
      usernameLowerCase,
      email,
      displayName,
    );
    await this.userService.setUserData(uid, userData);

    // Save the username to UID mapping to allow for easy username duplication checks
    await this.userService.setUsernameToUid(usernameLowerCase, uid);

    return userData;
  }

  // Removed unused password parameter - since we're just verifying a record exists
  // Password authentication happens on the client via Firebase SDK
  async login(email: string): Promise<{ token: string; user: UserData }> {
    try {
      // Get the user from Firebase Auth
      const userRecord = await this.firebase.getAuth().getUserByEmail(email);

      // Get the user data from Firestore
      const userData = await this.userService.getUserDataByUid(userRecord.uid);

      if (!userData) {
        throw new InvalidCredentialsError();
      }

      // Create a custom token for the user (this is not the same as an ID token)
      // The client will exchange this for an ID token
      const customToken = await this.firebase
        .getAuth()
        .createCustomToken(userRecord.uid);

      return {
        token: customToken,
        user: userData,
      };
    } catch (error: unknown) {
      // Safely log error with proper type checking
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Login error: ${errorMessage}`, errorStack);
      throw new InvalidCredentialsError();
    }
  }

  async verifyToken(token: string): Promise<UserData> {
    try {
      // Verify the ID token
      const decodedToken = await this.firebase.getAuth().verifyIdToken(token);

      // Get the user data from Firestore
      const userData = await this.userService.getUserDataByUid(
        decodedToken.uid,
      );

      if (!userData) {
        throw new Error('User data not found');
      }

      return userData;
    } catch (error: unknown) {
      // Safely log error with proper type checking
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Token verification error: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  private async isEmailTaken(email: string): Promise<boolean> {
    try {
      await this.firebase.getAuth().getUserByEmail(email);
      return true;
    } catch {
      return false;
    }
  }
}
