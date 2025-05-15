import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get<string>('firebase.projectId'),
        privateKey: this.configService.get<string>('firebase.privateKey'),
        clientEmail: this.configService.get<string>('firebase.clientEmail'),
      }),
    });
  }

  getAuth() {
    return admin.auth();
  }

  getFirestore() {
    return admin.firestore();
  }

  // Verify Firebase token
  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return await admin.auth().verifyIdToken(token);
  }
}
