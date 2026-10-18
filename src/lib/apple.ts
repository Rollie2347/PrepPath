import { AppleAuthProvider, linkWithCredential, revokeToken, signInWithCredential } from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { auth } from './firebase';

export type AppleSignInResult = { givenName: string | null; switchedAccount: boolean } | null;

/**
 * Shows the Apple sheet and returns a Firebase credential. Each identity token is bound to its
 * nonce and is single-use: Firebase rejects a second use with "Duplicate credential received",
 * so every sign-in or link attempt needs its own call. Returns null if the user cancels.
 */
async function appleCredential() {
  const nonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const apple = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      nonce: hashed,
    });
    if (!apple.identityToken) throw new Error('Apple returned no identity token');
    return { credential: AppleAuthProvider.credential(apple.identityToken, nonce), givenName: apple.fullName?.givenName ?? null };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}

/**
 * Onboarding: nothing to keep on the anonymous account yet, so sign straight in. A new Apple ID
 * creates its account; one that already finished onboarding loads that account and the router
 * guard leaves onboarding.
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const c = await appleCredential();
  if (!c) return null;
  await signInWithCredential(auth, c.credential);
  return { givenName: c.givenName, switchedAccount: true };
}

/**
 * Profile: link onto the anonymous account so its progress carries over (same uid). If this
 * Apple ID already has an account, ask `confirmSwitch`, then sign in with a fresh credential.
 */
export async function linkApple(confirmSwitch: () => Promise<boolean>): Promise<AppleSignInResult> {
  const user = auth.currentUser;
  if (!user?.isAnonymous) return signInWithApple();
  const c = await appleCredential();
  if (!c) return null;
  try {
    await linkWithCredential(user, c.credential);
    return { givenName: c.givenName, switchedAccount: false };
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/credential-already-in-use') throw e;
    if (!(await confirmSwitch())) return null;
    return signInWithApple();
  }
}

/**
 * Account deletion: Apple requires revoking the Sign in with Apple token. This needs a fresh
 * authorization code, so the Apple sheet shows once more. Returns false if the user cancels.
 * Accounts without Apple (anonymous) have nothing to revoke.
 */
export async function revokeAppleIfLinked(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.providerData.some((p) => p.providerId === 'apple.com')) return true;
  try {
    const apple = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    if (!apple.authorizationCode) throw new Error('Apple returned no authorization code');
    await revokeToken(auth, apple.authorizationCode);
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
}
