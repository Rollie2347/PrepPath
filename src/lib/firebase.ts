import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions';
import Constants from 'expo-constants';

// Native SDKs read GoogleService-Info.plist at build time; no JS config needed.
export const auth = getAuth();
export const db = getFirestore();
export const functions = getFunctions();

// Functions need the Blaze plan in production, so dev runs against the local emulator suite.
// The phone reaches the emulators on the same LAN host that serves the Metro bundle.
if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === '1') {
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}
