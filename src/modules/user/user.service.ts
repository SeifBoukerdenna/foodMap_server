/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserData } from './user';

type UidDocument = { uid: string };

@Injectable()
export class UserService {
    constructor(
        private firebase: FirebaseService,
    ) {}

    async getEmailByUsername(username: string): Promise<string | null> {
        const uid = await this.getUidByUsername(username);
        if (!uid) return null;
        const user = await this.getUserDataByUid(uid);
        if (!user) return null;
        return user.email || null;
    }

    async setUserData(uid: string, userData: UserData) {
        const userRef = this.getUidToUserDataRef(uid);
        return userRef.set(userData);
    }

    async getUserDataByUid(uid: string): Promise<UserData | null> {
        const userRef = this.getUidToUserDataRef(uid);
        const user = await userRef.get();
        if (user.exists) {
            return user.data() as UserData;
        } else {
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

    createDefaultUserData(uid: string, username: string, email: string | null = null, displayName: string): UserData {
        return {
            uid,
            username,
            email,
            displayName
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
