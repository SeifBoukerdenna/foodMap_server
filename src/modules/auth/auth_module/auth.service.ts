/* eslint-disable prettier/prettier */
// src/modules/auth/auth.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { EmailAlreadyExistsError, UsernameAlreadyExistsError } from './auth.error';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserService } from 'src/modules/user/user.service';
import { UserData } from 'src/modules/user/user';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
        private firebase: FirebaseService,
        private userService: UserService,
    ) {}

       async register(email: string, username: string, password: string, displayName: string): Promise<UserData> {
        const usernameLowerCase = username.toLowerCase();

        if (await this.userService.isUsernameTaken(usernameLowerCase)) {
            throw new UsernameAlreadyExistsError();
        }

        if (await this.isEmailTaken(email)) {
            throw new EmailAlreadyExistsError();
        }

        const { uid } = await this.firebase.getAuth().createUser({ email, displayName: usernameLowerCase, password });

        // Set user data based on the UID
        const userData = this.userService.createDefaultUserData(uid, usernameLowerCase, email, displayName);
        await this.userService.setUserData(uid, userData);

        // Save the username to UID mapping to allow for easy username duplication checks
        await this.userService.setUsernameToUid(usernameLowerCase, uid);

        return userData;
    }

    private async isEmailTaken(email: string): Promise<boolean> {
        try {
            await this.firebase.getAuth().getUserByEmail(email);
            return true;
        } catch{
            return false;
        }
    }
  
}