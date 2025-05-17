import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    // Check if we have a service account path or direct credentials
    const serviceAccountPath = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );

    let credential;
    if (serviceAccountPath) {
      // Use credentials from file
      credential = admin.credential.cert(serviceAccountPath);
    } else {
      // Use environment variables
      const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
      let privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');

      // Ensure proper formatting of private key
      if (privateKey) {
        // Replace literal "\n" with actual newlines if needed
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Log the beginning of the private key (without revealing the whole thing)
      console.log(
        `Firebase private key starts with: ${privateKey?.substring(0, 15)}...`,
      );
      console.log(`Project ID: ${projectId}`);
      console.log(`Client Email: ${clientEmail}`);

      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }

    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');

    try {
      // Use initializeApp with error handling
      return admin.initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        credential,
        databaseURL: `https://${projectId}.firebaseio.com`,
        storageBucket: `${projectId}.appspot.com`,
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [firebaseProvider, FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
