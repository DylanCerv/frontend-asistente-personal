import Ionicons from '@react-native-vector-icons/ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="tasks">
        <Label>Tareas</Label>
        <Icon
          selectedColor={colors.primary}
          src={<VectorIcon family={Ionicons} name="checkbox-outline" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <Label>Inicio</Label>
        <Icon
          selectedColor={colors.primary}
          src={<VectorIcon family={Ionicons} name="sparkles-outline" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Perfil</Label>
        <Icon
          selectedColor={colors.primary}
          src={<VectorIcon family={Ionicons} name="person-circle-outline" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
