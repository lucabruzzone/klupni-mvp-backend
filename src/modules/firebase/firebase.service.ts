import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseTokenPayload {
  provider: string;
  providerUserId: string;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

const PROVIDER_MAP: Record<string, string> = {
  'google.com': 'google',
  'apple.com': 'apple',
  'facebook.com': 'facebook',
};

@Injectable()
export class FirebaseService {
  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (projectId && clientEmail && privateKey) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<FirebaseTokenPayload> {
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);

    const signInProvider = decodedToken.firebase?.sign_in_provider ?? 'unknown';
    const provider = PROVIDER_MAP[signInProvider] ?? signInProvider.replace('.com', '');

    const identities = decodedToken.firebase?.identities ?? {};
    const providerIdentities = identities[signInProvider];
    const providerUserId = Array.isArray(providerIdentities)
      ? providerIdentities[0]
      : decodedToken.uid;

    return {
      provider,
      providerUserId: String(providerUserId ?? decodedToken.uid),
      firebaseUid: decodedToken.uid,
      email: decodedToken.email ?? '',
      emailVerified: decodedToken.email_verified ?? false,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  }
}
