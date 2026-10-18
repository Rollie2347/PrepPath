import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { predictScore } from '@shared/adaptive/score';
import { SHOP_PRICES } from '@shared/api';
import { TIERS } from '@shared/progression/league';
import { getTest } from '@shared/taxonomy';

import { GameButton } from '@/components/game-button';
import { LINKS, TRADEMARK_NOTICE } from '@/constants/links';
import { Brand } from '@/constants/theme';
import { buyItem, deleteAccount } from '@/data/api';
import { useTheme } from '@/hooks/use-theme';
import { linkApple as linkAppleAccount, revokeAppleIfLinked } from '@/lib/apple';
import { auth } from '@/lib/firebase';
import { useSession } from '@/state/session';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, profile, progress } = useSession();
  const [busy, setBusy] = useState(false);
  if (!profile || !user) return null;
  const { game } = profile;

  const linkApple = async () => {
    try {
      await linkAppleAccount(
        () =>
          new Promise((resolve) =>
            Alert.alert(
              'Switch accounts?',
              'This Apple ID already has a PrepPath account. Switching loads that account; progress made on this device without signing in will be lost.',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Switch', onPress: () => resolve(true) },
              ],
            ),
          ),
      );
    } catch (e) {
      Alert.alert('Sign in failed', e instanceof Error ? e.message : String(e));
    }
  };

  // App Store 5.1.1(v): deletion from inside the app. Signing out afterwards drops to a fresh
  // anonymous session, and the router guard shows onboarding.
  const removeAccount = () =>
    Alert.alert('Delete your account?', 'This permanently deletes your progress, XP, streak, gems and league history. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            if (!(await revokeAppleIfLinked())) return;
            await deleteAccount();
            await auth.signOut();
          } catch (e) {
            Alert.alert("Couldn't delete your account", e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const buyFreeze = async () => {
    setBusy(true);
    try {
      await buyItem({ item: 'streakFreeze' });
    } catch (e) {
      Alert.alert("Couldn't buy", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text style={styles.avatar}>{profile.avatar}</Text>
          <Text style={[styles.name, { color: theme.text }]}>{profile.displayName}</Text>
          <Text style={{ color: theme.textSecondary }}>{TIERS[game.leagueTier]} League</Text>
        </View>

        <View style={styles.grid}>
          <Stat label="Day streak" value={game.streak.count} color={Brand.flame} />
          <Stat label="Total XP" value={game.xp} color={Brand.gold} />
          <Stat label="Gems" value={game.gems} color={Brand.gem} />
          <Stat label="Longest streak" value={game.streak.longest} color={Brand.flame} />
        </View>

        {profile.tests.map((t) => {
          const est = predictScore(t, progress.mastery);
          const goal = profile.goals[t];
          return (
            <View key={t} style={[styles.card, { borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.h2, { color: theme.text }]}>{getTest(t).name} estimate</Text>
              <Text style={[styles.big, { color: t === 'sat' ? Brand.sat : Brand.act }]}>
                {est.low}–{est.high}
              </Text>
              {goal && <Text style={{ color: theme.textSecondary }}>Target: {goal.target}</Text>}
              <Text style={[styles.note, { color: theme.textSecondary }]}>
                Estimate from your practice so far. Not an official score; it narrows as you answer more questions.
              </Text>
            </View>
          );
        })}

        <View style={[styles.card, { borderColor: theme.backgroundSelected }]}>
          <Text style={[styles.h2, { color: theme.text }]}>Shop</Text>
          <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>
            Streak freezes: {game.streak.freezes}/2. Gems are earned by playing, never sold.
          </Text>
          <GameButton
            title={`Streak freeze · ${SHOP_PRICES.streakFreeze} gems`}
            disabled={busy || game.gems < SHOP_PRICES.streakFreeze || game.streak.freezes >= 2}
            onPress={buyFreeze}
          />
        </View>

        {user.isAnonymous && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 8, textAlign: 'center' }}>
              Save your progress across devices
            </Text>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={{ height: 50 }}
              onPress={linkApple}
            />
          </View>
        )}
        {!user.isAnonymous && (
          <GameButton title="Sign out" variant="locked" onPress={() => auth.signOut()} style={{ marginTop: 8 }} />
        )}

        <View style={styles.links}>
          <Link label="Privacy" url={LINKS.privacy} />
          <Link label="Terms" url={LINKS.terms} />
          <Link label="Support" url={LINKS.support} />
        </View>
        <Pressable onPress={removeAccount} disabled={busy} hitSlop={8}>
          <Text style={{ color: Brand.wrong, textAlign: 'center', fontWeight: '700' }}>Delete account</Text>
        </Pressable>
        <Text style={[styles.note, { color: theme.textSecondary, textAlign: 'center' }]}>{TRADEMARK_NOTICE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Link({ label, url }: { label: string; url: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(url)} hitSlop={8}>
      <Text style={{ color: theme.textSecondary, fontWeight: '700', textDecorationLine: 'underline' }}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { borderColor: theme.backgroundSelected }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 120 },
  header: { alignItems: 'center', gap: 4 },
  avatar: { fontSize: 64 },
  name: { fontSize: 24, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', borderWidth: 2, borderRadius: 14, padding: 14 },
  statValue: { fontSize: 24, fontWeight: '800' },
  card: { borderWidth: 2, borderRadius: 16, padding: 16 },
  h2: { fontSize: 18, fontWeight: '800' },
  big: { fontSize: 34, fontWeight: '800', marginVertical: 4 },
  note: { fontSize: 12, marginTop: 8 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
});
