import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Brand, Colors } from '@/constants/theme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs backgroundColor={colors.background} tintColor={Brand.primary}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <NativeTabs.Trigger.Label>Practice</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="league">
        <NativeTabs.Trigger.Label>Leagues</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
