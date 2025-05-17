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
}
