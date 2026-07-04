import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import {
  ProfileSettingsSheet,
  type ProfileSheetType,
} from '@/components/profile-settings-sheet';
import { ScreenHeader } from '@/components/screen-header';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { useUserPreferences } from '@/context/user-preferences-context';

const QUICK_ACCESS_OPTIONS = [
  {
    id: 'app-shortcut',
    icon: 'phone-portrait-outline' as const,
    label: 'Mantén presionado el ícono de la app',
    description: 'Aparece "Hablar" para grabar sin entrar a la app.',
    status: 'available' as const,
  },
  {
    id: 'deep-link',
    icon: 'link-outline' as const,
    label: 'Enlace directo kivo://capture',
    description: 'Abre captura de voz desde atajos del sistema o Siri.',
    status: 'available' as const,
  },
  {
    id: 'widget',
    icon: 'grid-outline' as const,
    label: 'Widget en pantalla de inicio',
    description: 'Botón gigante de micrófono en la pantalla principal.',
    status: 'coming' as const,
  },
  {
    id: 'lock-screen',
    icon: 'lock-closed-outline' as const,
    label: 'Pantalla bloqueada',
    description: 'Botón "Nuevo recordatorio" sin desbloquear.',
    status: 'coming' as const,
  },
] as const;

const INTEGRATIONS = [
  { id: 'calendar', icon: 'calendar-outline' as const, label: 'Calendario', status: 'Próximamente' },
  { id: 'gmail', icon: 'mail-outline' as const, label: 'Correo', status: 'Próximamente' },
  { id: 'whatsapp', icon: 'logo-whatsapp' as const, label: 'WhatsApp', status: 'Próximamente' },
] as const;

const SETTINGS_MENU = [
  { id: 'personal' as const, icon: 'person-outline' as const, label: 'Datos personales' },
  { id: 'security' as const, icon: 'shield-checkmark-outline' as const, label: 'Seguridad' },
  { id: 'notifications' as const, icon: 'notifications-outline' as const, label: 'Notificaciones' },
  { id: 'language' as const, icon: 'language-outline' as const, label: 'Idioma' },
  { id: 'subscription' as const, icon: 'diamond-outline' as const, label: 'Suscripción' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { resetFlow } = useAppFlow();
  const { autoSendVoice, setAutoSendVoice, language } = useUserPreferences();
  const { plan } = useSubscription();
  const [activeSheet, setActiveSheet] = useState<ProfileSheetType>(null);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showComingQuickAccess, setShowComingQuickAccess] = useState(false);

  const availableQuickAccess = QUICK_ACCESS_OPTIONS.filter((item) => item.status === 'available');
  const comingQuickAccess = QUICK_ACCESS_OPTIONS.filter((item) => item.status === 'coming');

  function handleSignOut() {
    void resetFlow();
    signOut();
    router.replace('/login');
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';

  function getMenuValue(id: ProfileSheetType): string | undefined {
    if (id === 'language') return language === 'es' ? 'Español' : 'English';
    if (id === 'subscription') return plan.name;
    return undefined;
  }

  return (
    <ScreenSafeArea>
      <ScreenHeader title="Perfil" subtitle="Cuenta, integraciones y preferencias" />
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-4">

        <View className="overflow-hidden rounded-[32px] border border-border bg-muted dark:border-border-dark dark:bg-muted-dark">
          <View className="items-center gap-4 px-6 pb-6 pt-8">
            <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-brand dark:border-surface-dark dark:bg-brand-dark">
              <Text className="text-4xl font-bold text-white">{initial}</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {user?.name ?? 'Usuario'}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">{user?.email}</Text>
            </View>
          </View>

          <View className="flex-row border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
            <View className="flex-1 items-center gap-1 border-r border-border py-4 dark:border-border-dark">
              <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
              <Text className="text-xs font-medium text-subtle dark:text-subtle-dark">
                {plan.name}
              </Text>
            </View>
            <View className="flex-1 items-center gap-1 py-4">
              <Ionicons name="mic-outline" size={20} color="#7C3AED" />
              <Text className="text-xs font-medium text-subtle dark:text-subtle-dark">
                Voz activa
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Cuenta y preferencias
          </Text>
          {SETTINGS_MENU.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setActiveSheet(item.id)}
              className="flex-row items-center gap-3 rounded-2xl bg-canvas p-3 active:opacity-80 dark:bg-canvas-dark">
              <Ionicons name={item.icon} size={20} color="#7C3AED" />
              <Text className="flex-1 text-[15px] font-medium text-foreground dark:text-foreground-dark">
                {item.label}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">
                {getMenuValue(item.id) ?? ''}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#6B6475" />
            </Pressable>
          ))}
        </View>

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Voz
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
            <View className="flex-1 gap-1">
              <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                Enviar audio automáticamente
              </Text>
              <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
                {autoSendVoice
                  ? 'Se envía al detener la grabación.'
                  : 'Escucha antes de enviar.'}
              </Text>
            </View>
            <Switch
              value={autoSendVoice}
              onValueChange={setAutoSendVoice}
              trackColor={{ false: '#E7DFF5', true: '#A78BFA' }}
              thumbColor={autoSendVoice ? '#7C3AED' : '#FFFFFF'}
            />
          </View>
        </View>

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Accesos rápidos
          </Text>
          {availableQuickAccess.map((item) => (
            <View
              key={item.id}
              className="flex-row items-start gap-3 rounded-2xl bg-canvas p-3 dark:bg-canvas-dark">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                <Ionicons name={item.icon} size={20} color="#7C3AED" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-[15px] font-medium text-foreground dark:text-foreground-dark">
                  {item.label}
                </Text>
                <Text className="text-xs text-subtle dark:text-subtle-dark">{item.description}</Text>
              </View>
            </View>
          ))}
          {comingQuickAccess.length > 0 ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowComingQuickAccess((value) => !value)}
                className="flex-row items-center justify-between rounded-2xl bg-canvas px-3 py-3 dark:bg-canvas-dark">
                <Text className="text-sm font-medium text-subtle dark:text-subtle-dark">
                  Próximamente ({comingQuickAccess.length})
                </Text>
                <Ionicons
                  name={showComingQuickAccess ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6B6475"
                />
              </Pressable>
              {showComingQuickAccess
                ? comingQuickAccess.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-start gap-3 rounded-2xl bg-canvas p-3 opacity-70 dark:bg-canvas-dark">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                        <Ionicons name={item.icon} size={20} color="#7C3AED" />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-[15px] font-medium text-foreground dark:text-foreground-dark">
                          {item.label}
                        </Text>
                        <Text className="text-xs text-subtle dark:text-subtle-dark">
                          {item.description}
                        </Text>
                      </View>
                    </View>
                  ))
                : null}
            </>
          ) : null}
        </View>

        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowIntegrations((value) => !value)}
            className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Integraciones
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">
                Calendario, correo y más — próximamente
              </Text>
            </View>
            <Ionicons
              name={showIntegrations ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B6475"
            />
          </Pressable>
          {showIntegrations
            ? INTEGRATIONS.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 rounded-2xl bg-canvas p-3 dark:bg-canvas-dark">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                    <Ionicons name={item.icon} size={20} color="#7C3AED" />
                  </View>
                  <Text className="flex-1 text-[15px] font-medium text-foreground dark:text-foreground-dark">
                    {item.label}
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">{item.status}</Text>
                </View>
              ))
            : null}
        </View>

        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Apariencia
          </Text>
          <ThemeToggle variant="cards" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-surface active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="text-base font-semibold text-danger dark:text-danger-dark">
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>

      <ProfileSettingsSheet type={activeSheet} onClose={() => setActiveSheet(null)} />
    </ScreenSafeArea>
  );
}
