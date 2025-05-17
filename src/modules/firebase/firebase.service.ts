import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { AppCheck } from 'firebase-admin/lib/app-check/app-check';

@Injectable()
export class FirebaseService {
  db: Firestore;

  constructor(@Inject('FIREBASE_APP') private firebaseApp: app.App) {
    this.db = firebaseApp.firestore();
  }

  getAuth() {
    return this.firebaseApp.auth();
  }

  getFirestore() {
    return this.firebaseApp.firestore();
  }

  getAppCheck(): AppCheck {
    return this.firebaseApp.appCheck();
  }
}
