// src/modules/user/user.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserData } from './user';
import { FirebaseService } from '../firebase/firebase.service';

type UidDocument = { uid: string };

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private firebase: FirebaseService) {}

  async getEmailByUsername(username: string): Promise<string | null> {
    const uid = await this.getUidByUsername(username);
    if (!uid) return null;
    const user = await this.getUserDataByUid(uid);
    if (!user) return null;
    return user.email || null;
  }

  async setUserData(uid: string, userData: UserData) {
    this.logger.log(`Setting user data for UID: ${uid}`);
    const userRef = this.getUidToUserDataRef(uid);
    return userRef.set(userData);
  }

  async getUserDataByUid(uid: string): Promise<UserData | null> {
    const userRef = this.getUidToUserDataRef(uid);
    const user = await userRef.get();
    if (user.exists) {
      return user.data() as UserData;
    } else {
      this.logger.warn(`No user data found for UID: ${uid}`);
      return null;
    }
  }

  async getUserDataByUsername(username: string): Promise<UserData | null> {
    const usernameLowerCase = username.toLowerCase();

    const uid = await this.getUidByUsername(usernameLowerCase);
    if (!uid) return null;
    return this.getUserDataByUid(uid);
  }

  async getUidByUsername(username: string): Promise<string | null> {
    const usernameLowerCase = username.toLowerCase();

    const usernameRef = this.getUsernamesToUidRef(usernameLowerCase);
    const usernameDoc = await usernameRef.get();
    if (usernameDoc.exists) {
      return (usernameDoc.data() as UidDocument).uid;
    } else {
      return null;
    }
  }

  async setUsernameToUid(username: string, uid: string) {
    this.logger.log(`Setting username ${username} to UID: ${uid}`);
    const usernameLowerCase = username.toLowerCase();

    const usernameRef = this.getUsernamesToUidRef(usernameLowerCase);
    return usernameRef.set({ uid });
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const usernameLowerCase = username.toLowerCase();
    const usernameRef = this.getUsernamesToUidRef(usernameLowerCase);
    const usernameDoc = await usernameRef.get();
    return usernameDoc.exists;
  }

  async exists(uid: string): Promise<boolean> {
    const userRef = this.getUidToUserDataRef(uid);
    const user = await userRef.get();
    return user.exists;
  }

  createDefaultUserData(
    uid: string,
    username: string,
    email: string | null = null,
    displayName: string,
  ): UserData {
    this.logger.log(
      `Creating default user data for UID: ${uid}, username: ${username}, displayName: ${displayName}`,
    );
    return {
      uid,
      username,
      email,
      displayName,
    };
  }

  getUidToUserDataRef(uid: string) {
    return this.firebase.db.collection('users_data').doc(uid);
  }

  async getAllUsers(): Promise<UserData[]> {
    const usersSnapshot = await this.firebase.db.collection('users_data').get();
    return usersSnapshot.docs.map((doc) => doc.data() as UserData);
  }

  private getUsernamesToUidRef(username: string) {
    return this.firebase.db.collection('usernames').doc(username);
  }

  // Add the new updateUsername method
  async updateUsername(
    uid: string,
    username: string,
    displayName: string,
  ): Promise<UserData> {
    this.logger.log(
      `Updating username for UID ${uid}: ${username}, displayName: ${displayName}`,
    );

    // Check if username is already taken by someone else
    const existingUserWithUsername = await this.getUidByUsername(username);
    if (existingUserWithUsername && existingUserWithUsername !== uid) {
      // If username is taken, append a number
      let counter = 1;
      let newUsername = `${username}${counter}`;

      while (await this.isUsernameTaken(newUsername)) {
        counter++;
        newUsername = `${username}${counter}`;
      }

      this.logger.log(
        `Username ${username} already taken, using ${newUsername} instead`,
      );
      username = newUsername;
    }

    // Get current user data
    const userData = await this.getUserDataByUid(uid);
    if (!userData) {
      throw new Error(`User data not found for UID: ${uid}`);
    }

    // Update user data
    const updatedData: UserData = {
      ...userData,
      username,
      displayName,
    };

    // Save to Firestore
    await this.setUserData(uid, updatedData);

    // Update username mapping
    if (userData.username !== username) {
      // Remove old username mapping if it exists
      if (userData.username) {
        try {
          await this.firebase.db
            .collection('usernames')
            .doc(userData.username)
            .delete();
          this.logger.log(`Removed old username mapping: ${userData.username}`);
        } catch (error) {
          this.logger.error(
            `Error removing old username mapping: ${JSON.stringify(error, null, 2)}`,
          );
        }
      }

      // Set new username mapping
      await this.setUsernameToUid(username, uid);
    }

    this.logger.log(`Username updated for UID ${uid}: ${username}`);

    return updatedData;
  }
  async deleteAccount(uid: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting account for UID: ${uid}`);

    try {
      // Get user data first to get username
      const userData = await this.getUserDataByUid(uid);

      if (!userData) {
        this.logger.warn(`No user data found for UID: ${uid} during deletion`);
        return { success: false };
      }

      // Delete from all collections
      const batch = this.firebase.db.batch();

      // Delete from users_data
      const userDataRef = this.getUidToUserDataRef(uid);
      batch.delete(userDataRef);

      // Delete username mapping if it exists
      if (userData.username) {
        const usernameRef = this.getUsernamesToUidRef(userData.username);
        batch.delete(usernameRef);
      }

      // Commit the batch
      await batch.commit();

      this.logger.log(`Successfully deleted account data for UID: ${uid}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Error deleting account for UID ${uid}: ${error.message}`,
      );
      throw error;
    }
  }
}
