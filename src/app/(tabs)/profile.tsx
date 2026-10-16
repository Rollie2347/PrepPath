import { AppleAuthProvider, linkWithCredential } from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { predictScore } from '@shared/adaptive/score';
import { SHOP_PRICES } from '@shared/api';
import { TIERS } from '@shared/progression/league';
import { getTest } from '@shared/taxonomy';

import { GameButton } from '@/components/game-button';
import { Brand } from '@/constants/theme';
import { buyItem } from '@/data/api';
import { useTheme } from '@/hooks/use-theme';
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
      const nonce = Crypto.randomUUID();
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
      const apple = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
        nonce: hashed,
      });
      if (!apple.identityToken) throw new Error('Apple returned no identity token');
      // Link keeps the same uid, so all anonymous progress carries over.
      await linkWithCredential(user, AppleAuthProvider.credential(apple.identityToken, nonce));
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign in failed', e instanceof Error ? e.message : String(e));
    }
  };

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
      </ScrollView>
    </SafeAreaView>
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
});
