// src/modules/auth/auth_module/auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  InvalidCredentialsError,
} from './auth.error';
import { UserService } from 'src/modules/user/user.service';
import { UserData } from 'src/modules/user/user';
import { FirebaseService } from 'src/modules/firebase/firebase.service';
import { auth } from 'firebase-admin';
import { FirebaseError } from 'firebase-admin/lib/utils/error';

// Type for safely handling errors
interface ErrorWithCode {
  code?: string;
  message: string;
  stack?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private firebase: FirebaseService,
    private userService: UserService,
  ) {}

  /**
   * Register a new user in both Firebase Auth and Firestore
   */
  async register(
    email: string,
    username: string,
    password: string,
    displayName: string,
  ): Promise<UserData> {
    const usernameLowerCase = username.toLowerCase();

    try {
      // First, check if the username is taken in our database
      if (await this.userService.isUsernameTaken(usernameLowerCase)) {
        this.logger.warn(`Username ${usernameLowerCase} already taken`);
        throw new UsernameAlreadyExistsError();
      }

      // Check if the email is taken in our database
      if (await this.isEmailTaken(email)) {
        this.logger.warn(`Email ${email} already taken in database`);
        throw new EmailAlreadyExistsError();
      }

      // Try to get the user by email from Firebase Auth
      let uid: string;
      try {
        const existingUser = await this.firebase
          .getAuth()
          .getUserByEmail(email);
        // If we get here, the user already exists in Firebase Auth but not in our database
        uid = existingUser.uid;
        this.logger.log(
          `User with email ${email} already exists in Firebase Auth, using UID: ${uid}`,
        );
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        if (firebaseError.code === 'auth/user-not-found') {
          // User doesn't exist in Firebase Auth, create it
          try {
            const newUser = await this.firebase.getAuth().createUser({
              email,
              password,
              displayName: displayName || usernameLowerCase,
            });
            uid = newUser.uid;
            this.logger.log(
              `Created new user in Firebase Auth with UID: ${uid}`,
            );
          } catch (createError: unknown) {
            const typedError = createError as Error;
            this.logger.error(
              `Error creating Firebase user: ${typedError.message}`,
            );
            throw createError;
          }
        } else {
          // Some other error occurred
          this.logger.error(`Firebase error: ${firebaseError.message}`);
          throw error;
        }
      }

      // Now we have a valid UID, create or update the user data in Firestore
      const userData = this.userService.createDefaultUserData(
        uid,
        usernameLowerCase,
        email,
        displayName || usernameLowerCase,
      );

      // Save the user data to Firestore
      try {
        await this.userService.setUserData(uid, userData);
        this.logger.log(`User data saved to Firestore for UID: ${uid}`);
      } catch (dbError: unknown) {
        const typedError = dbError as Error;
        this.logger.error(
          `Failed to save user data to Firestore: ${typedError.message}`,
        );
        throw dbError;
      }

      // Save the username to UID mapping
      try {
        await this.userService.setUsernameToUid(usernameLowerCase, uid);
        this.logger.log(
          `Username mapping saved: ${usernameLowerCase} -> ${uid}`,
        );
      } catch (mappingError: unknown) {
        const typedError = mappingError as Error;
        this.logger.error(
          `Failed to save username mapping: ${typedError.message}`,
        );
        // Continue anyway since the user data is already saved
      }

      return userData;
    } catch (error: unknown) {
      // Handle specific errors
      if (
        error instanceof UsernameAlreadyExistsError ||
        error instanceof EmailAlreadyExistsError
      ) {
        throw error;
      }

      // Log and rethrow any other errors
      const typedError = error as Error;
      this.logger.error(
        `Registration error: ${typedError.message}`,
        typedError.stack,
      );
      throw error;
    }
  }

  /**
   * Login a user with email
   * Note: Password verification happens on the client via Firebase SDK
   */
  async login(email: string): Promise<{ token: string; user: UserData }> {
    try {
      // Get the user from Firebase Auth
      let userRecord: auth.UserRecord;
      try {
        userRecord = await this.firebase.getAuth().getUserByEmail(email);
      } catch (authError: unknown) {
        const typedError = authError as Error;
        this.logger.error(
          `Auth error when looking up user by email: ${typedError.message}`,
        );
        throw new InvalidCredentialsError();
      }

      // Get the user data from Firestore
      let userData = await this.userService.getUserDataByUid(userRecord.uid);

      // If user data doesn't exist in Firestore, create it
      if (!userData) {
        this.logger.warn(
          `User ${userRecord.uid} exists in Auth but not in Firestore. Creating user data.`,
        );

        // Create a default username from email
        const username = email.split('@')[0].toLowerCase();

        userData = this.userService.createDefaultUserData(
          userRecord.uid,
          username,
          email,
          userRecord.displayName || username,
        );

        // Save to Firestore
        await this.userService.setUserData(userRecord.uid, userData);

        // Also save username mapping if it doesn't exist
        const isUsernameTaken =
          await this.userService.isUsernameTaken(username);
        if (!isUsernameTaken) {
          await this.userService.setUsernameToUid(username, userRecord.uid);
        }

        this.logger.log(`Created missing user data for ${userRecord.uid}`);
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
      if (error instanceof Error) {
        this.logger.error(`Login error: ${error.message}`, error.stack);
      } else {
        this.logger.error('Login error: Unknown error type');
      }

      if (error instanceof InvalidCredentialsError) {
        throw error;
      }

      throw new InvalidCredentialsError();
    }
  }

  /**
   * Verify a Firebase ID token and return the associated user data
   * Creates missing user data if needed
   */
  async verifyToken(token: string): Promise<UserData> {
    try {
      // Verify the ID token
      let decodedToken: auth.DecodedIdToken;
      try {
        decodedToken = await this.firebase.getAuth().verifyIdToken(token);
        this.logger.log(`Token verified for UID: ${decodedToken.uid}`);
      } catch (tokenError: unknown) {
        const typedError = tokenError as Error;
        this.logger.error(`Token verification failed: ${typedError.message}`);
        throw tokenError;
      }

      // Get the user data from Firestore
      let userData = await this.userService.getUserDataByUid(decodedToken.uid);

      // If user data doesn't exist in Firestore but token is valid, create it
      if (!userData) {
        this.logger.warn(
          `User ${decodedToken.uid} has valid token but no data in Firestore. Creating user data.`,
        );

        try {
          // Get the user record from Firebase Auth
          const userRecord = await this.firebase
            .getAuth()
            .getUser(decodedToken.uid);

          // Create a username from email or UID
          const username = userRecord.email
            ? userRecord.email.split('@')[0].toLowerCase()
            : `user_${decodedToken.uid.substring(0, 8)}`;

          // Create default user data
          userData = this.userService.createDefaultUserData(
            decodedToken.uid,
            username,
            userRecord.email || null,
            userRecord.displayName || username,
          );

          // Save user data to Firestore
          await this.userService.setUserData(decodedToken.uid, userData);

          // Also save username mapping if it doesn't already exist
          const isUsernameTaken =
            await this.userService.isUsernameTaken(username);
          if (!isUsernameTaken) {
            await this.userService.setUsernameToUid(username, decodedToken.uid);
          }

          this.logger.log(`Created missing user data for ${decodedToken.uid}`);
        } catch (error: unknown) {
          const typedError = error as Error;
          this.logger.error(
            `Failed to create user data: ${typedError.message}`,
          );
          throw new Error('Failed to create user data for valid token');
        }
      }

      return userData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Token verification error: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('Token verification error: Unknown error type');
      }
      throw error;
    }
  }

  /**
   * Send an email verification link to the specified email
   */
  async sendVerificationEmail(email: string): Promise<{ success: boolean }> {
    try {
      let userRecord: auth.UserRecord;
      try {
        userRecord = await this.firebase.getAuth().getUserByEmail(email);
      } catch (authError: unknown) {
        const typedError = authError as Error;
        this.logger.error(
          `User not found for verification email: ${typedError.message}`,
        );
        throw authError;
      }

      if (userRecord.emailVerified) {
        this.logger.log(`Email ${email} is already verified`);
        throw new Error('Email already verified');
      }

      // Generate the verification link
      const actionCodeSettings = {
        url:
          process.env.VERIFICATION_REDIRECT_URL ||
          'https://foodmap.app/verified',
        handleCodeInApp: true,
      };

      let link: string;
      try {
        link = await this.firebase
          .getAuth()
          .generateEmailVerificationLink(email, actionCodeSettings);
        this.logger.log(`Verification email link generated for ${email}`);
      } catch (linkError: unknown) {
        const typedError = linkError as Error;
        this.logger.error(
          `Failed to generate verification link: ${typedError.message}`,
        );
        throw linkError;
      }

      // In a production app, you would send the email here
      // For now, just log the link and return success
      this.logger.log(
        `Verification link for ${email}: ${link.substring(0, 50)}...`,
      );

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Send verification email error: ${error.message}`);
      } else {
        this.logger.error('Send verification email error: Unknown error type');
      }
      throw error;
    }
  }

  /**
   * Check if a user's email is verified
   */
  async checkEmailVerificationStatus(
    email: string,
  ): Promise<{ isVerified: boolean }> {
    try {
      let userRecord: auth.UserRecord;
      try {
        userRecord = await this.firebase.getAuth().getUserByEmail(email);
      } catch (authError: unknown) {
        const typedError = authError as Error;
        this.logger.error(
          `User not found for verification check: ${typedError.message}`,
        );
        throw authError;
      }

      return { isVerified: userRecord.emailVerified };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Check verification status error: ${error.message}`);
      } else {
        this.logger.error(
          'Check verification status error: Unknown error type',
        );
      }
      throw error;
    }
  }

  /**
   * Check if an email is already in use
   * Improved to handle the case where a user exists in Auth but not in Firestore
   */
  private async isEmailTaken(email: string): Promise<boolean> {
    try {
      // Check Firestore first to see if we already have the email in our database
      const usersSnapshot = await this.firebase.db
        .collection('users_data')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        this.logger.warn(`Email ${email} already exists in Firestore`);
        return true;
      }

      // If not in Firestore, check Firebase Auth
      try {
        await this.firebase.getAuth().getUserByEmail(email);
        // If we get here, the email exists in Firebase Auth but not in Firestore
        this.logger.warn(
          `Email ${email} exists in Firebase Auth but not in Firestore`,
        );

        // Important: If the user exists in Auth but not in Firestore,
        // we should NOT consider it taken - we'll create the missing data
        return false;
      } catch (error: unknown) {
        // Try to cast to Firebase error to check the code
        const firebaseError = error as ErrorWithCode;

        // Error code auth/user-not-found means the email is not taken
        if (firebaseError.code === 'auth/user-not-found') {
          return false;
        }
        // For any other error, log it but assume email is not taken
        this.logger.error(
          `Error checking email in Firebase Auth: ${firebaseError.message}`,
        );
        return false;
      }
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(
        `Error checking if email is taken: ${typedError.message}`,
      );
      // If there's an error, assume email is not taken to allow the operation to proceed
      return false;
    }
  }

  /**
   * Update a user's data
   */
  async updateUserData(
    uid: string,
    updateData: Partial<UserData>,
  ): Promise<UserData> {
    try {
      // Get current user data
      const userData = await this.userService.getUserDataByUid(uid);

      if (!userData) {
        throw new Error(`User data not found for UID: ${uid}`);
      }

      // Merge existing data with updates
      const updatedData: UserData = {
        ...userData,
        ...updateData,
      };

      // Save to Firestore
      await this.userService.setUserData(uid, updatedData);

      this.logger.log(`User data updated for UID: ${uid}`);
      return updatedData;
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(`Error updating user data: ${typedError.message}`);
      throw error;
    }
  }

  /**
   * Get a user's data by ID
   */
  async getUserData(uid: string): Promise<UserData> {
    try {
      const userData = await this.userService.getUserDataByUid(uid);

      if (!userData) {
        throw new Error(`User data not found for UID: ${uid}`);
      }

      return userData;
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(`Error getting user data: ${typedError.message}`);
      throw error;
    }
  }

  /**
   * Delete a user and all associated data
   */
  async deleteUser(uid: string): Promise<boolean> {
    try {
      // Get the user data to get the username
      const userData = await this.userService.getUserDataByUid(uid);

      if (!userData) {
        this.logger.warn(`No user data found for UID: ${uid} during deletion`);
      } else {
        // Remove the username mapping
        if (userData.username) {
          await this.firebase.db
            .collection('usernames')
            .doc(userData.username)
            .delete();
          this.logger.log(`Username mapping deleted for: ${userData.username}`);
        }

        // Delete user data from Firestore
        await this.firebase.db.collection('users_data').doc(uid).delete();
        this.logger.log(`User data deleted from Firestore for UID: ${uid}`);
      }

      // Delete the user from Firebase Auth
      await this.firebase.getAuth().deleteUser(uid);
      this.logger.log(`User deleted from Firebase Auth: ${uid}`);

      return true;
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(`Error deleting user: ${typedError.message}`);
      throw error;
    }
  }
}
