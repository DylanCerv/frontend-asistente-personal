import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
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
import { showAppAlert } from '@/services/app-dialog';
import { uploadAvatar } from '@/services/profiles/avatar-upload';

// ────────────────────────────────────────────────────────────────────────────────
// Quick access data — with step-by-step tutorials
// ────────────────────────────────────────────────────────────────────────────────

type QuickAccessItem = {
  id: string;
  icon: string;
  label: string;
  description: string;
  status: 'available' | 'coming';
  tutorial?: { platform: 'android' | 'ios' | 'both'; steps: string[] };
};

const QUICK_ACCESS_OPTIONS: QuickAccessItem[] = [
  {
    id: 'app-shortcut',
    icon: 'phone-portrait-outline',
    label: 'Acceso directo en el ícono',
    description: 'Mantén presionado el ícono de Kivo para ver acciones rápidas.',
    status: 'available',
    tutorial: {
      platform: 'both',
      steps: [
        'Ve a tu pantalla de inicio o cajón de apps.',
        'Mantén presionado el ícono de Kivo por 1–2 segundos.',
        'Aparece un menú con la opción "Capturar voz" — tócala.',
        'El micrófono se abrirá directamente sin entrar a la app.',
      ],
    },
  },
  {
    id: 'widget',
    icon: 'grid-outline',
    label: 'Widget en pantalla de inicio',
    description: 'Un botón de micrófono gigante en tu pantalla principal.',
    status: 'available',
    tutorial: {
      platform: 'android',
      steps: [
        'Mantén presionado un espacio vacío en tu pantalla de inicio.',
        'Toca "Widgets" (Samsung/Xiaomi/Pixel) o "Agregar widget" (otros).',
        'Busca "Kivo" en la lista de widgets.',
        'Arrastra el widget al lugar que prefieras.',
        'Listo — toca el botón de micrófono para capturar sin abrir la app.',
      ],
    },
  },
  {
    id: 'widget-ios',
    icon: 'grid-outline',
    label: 'Widget en iPhone',
    description: 'Agrega el widget de Kivo en la pantalla de inicio o Vista Hoy.',
    status: 'available',
    tutorial: {
      platform: 'ios',
      steps: [
        'Mantén presionado cualquier área vacía de la pantalla de inicio hasta que los íconos tiemblen.',
        'Toca el botón "+" (esquina superior izquierda).',
        'Busca "Kivo" en la barra de búsqueda.',
        'Selecciona el tamaño de widget que prefieras y toca "Agregar widget".',
        'Toca "Listo" para guardar.',
      ],
    },
  },
  {
    id: 'deep-link',
    icon: 'link-outline',
    label: 'Atajo del sistema (Samsung/Siri)',
    description: 'kivo://capture — abre la captura de voz desde atajos del sistema.',
    status: 'available',
    tutorial: {
      platform: 'both',
      steps: Platform.OS === 'android'
        ? [
            'Abre "Bixby Routines" o "Autopilot" en Samsung, o "Tasker" en otros Android.',
            'Crea una nueva rutina con el desencadenador que prefieras (doble botón lateral, gestos, etc.).',
            'Como acción, selecciona "Abrir URL/deep link".',
            'Escribe: kivo://capture',
            'Guarda la rutina — desde ahora ese atajo abre Kivo directo al micrófono.',
          ]
        : [
            'Abre la app "Atajos" (ya viene en iPhone).',
            'Toca "+" para crear un nuevo atajo.',
            'Busca la acción "Abrir URL" y escribe: kivo://capture',
            'Nómbralo "Capturar con Kivo".',
            'Toca el ícono del atajo → "Agregar a pantalla de inicio" para tener un acceso directo.',
            'También puedes agregarlo a Siri diciendo "Capturar con Kivo".',
          ],
    },
  },
  {
    id: 'lock-screen',
    icon: 'lock-closed-outline',
    label: 'Botón en pantalla bloqueada',
    description: 'Accede a Kivo sin desbloquear el teléfono.',
    status: 'coming',
    tutorial: undefined,
  },
];

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp',
    label: 'WhatsApp',
    description: 'Comparte reportes y registros por WhatsApp.',
    status: 'Próximamente',
  },
  {
    id: 'calendar',
    icon: 'calendar-outline',
    label: 'Calendario',
    description: 'Sincroniza tareas y eventos con Google Calendar.',
    status: 'Próximamente',
  },
  {
    id: 'gmail',
    icon: 'mail-outline',
    label: 'Correo',
    description: 'Recibe resúmenes diarios por Gmail u Outlook.',
    status: 'Próximamente',
  },
] as const;

const SETTINGS_MENU = [
  { id: 'personal' as const, icon: 'person-outline' as const, label: 'Datos personales' },
  { id: 'security' as const, icon: 'shield-checkmark-outline' as const, label: 'Seguridad' },
  { id: 'notifications' as const, icon: 'notifications-outline' as const, label: 'Notificaciones' },
  { id: 'language' as const, icon: 'language-outline' as const, label: 'Idioma' },
  { id: 'subscription' as const, icon: 'diamond-outline' as const, label: 'Suscripción' },
];

// ────────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateAvatar } = useAuth();
  const { resetFlow } = useAppFlow();
  const { autoSendVoice, setAutoSendVoice, language, preferredName } = useUserPreferences();
  const { plan } = useSubscription();
  const [activeSheet, setActiveSheet] = useState<ProfileSheetType>(null);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [expandedQuickAccess, setExpandedQuickAccess] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const isAndroid = Platform.OS === 'android';
  const isIos = Platform.OS === 'ios';

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAppAlert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0] || !user?.id) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(user.id, localUri);
      updateAvatar(publicUrl);
      setAvatarUri(publicUrl);
    } catch (error) {
      showAppAlert('Error', error instanceof Error ? error.message : 'No se pudo subir la foto.');
      setAvatarUri(user.avatarUrl ?? null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const visibleQuickAccess = QUICK_ACCESS_OPTIONS.filter((item) => {
    if (item.status === 'coming') return true;
    if (item.tutorial?.platform === 'android' && !isAndroid) return false;
    if (item.tutorial?.platform === 'ios' && !isIos) return false;
    return true;
  });

  function handleSignOut() {
    void resetFlow();
    signOut();
    router.replace('/login');
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A';

  function getMenuValue(id: ProfileSheetType): string | undefined {
    if (id === 'personal') return preferredName.trim() || user?.name || undefined;
    if (id === 'language') return language === 'es' ? 'Español' : 'English';
    if (id === 'subscription') return plan.name;
    return undefined;
  }

  return (
    <ScreenSafeArea>
      <ScreenHeader title="Perfil" subtitle="Cuenta, integraciones y preferencias" />
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-6 self-center px-6 pb-36 pt-4">

        {/* ── Profile card ── */}
        <View className="overflow-hidden rounded-[32px] border border-border bg-muted dark:border-border-dark dark:bg-muted-dark">
          <View className="items-center gap-4 px-6 pb-6 pt-8">
            {/* Tappable avatar */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              onPress={handlePickAvatar}
              className="relative">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-brand dark:border-surface-dark dark:bg-brand-dark">
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-4xl font-bold text-white">{initial}</Text>
                )}
              </View>
              {/* Camera badge */}
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-brand shadow-sm dark:bg-brand-dark">
                <Ionicons
                  name={isUploadingAvatar ? 'time-outline' : 'camera-outline'}
                  size={14}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {user?.name ?? 'Usuario'}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">{user?.email}</Text>
              {preferredName.trim() ? (
                <Text className="text-xs text-brand dark:text-brand-dark">
                  Kivo te llama: {preferredName.trim()}
                </Text>
              ) : null}
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

        {/* ── Settings menu ── */}
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

        {/* ── Voice ── */}
        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">Voz</Text>
          <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
            <View className="flex-1 gap-1">
              <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                Enviar audio automáticamente
              </Text>
              <Text className="text-xs leading-5 text-subtle dark:text-subtle-dark">
                {autoSendVoice ? 'Se envía al detener la grabación.' : 'Escucha antes de enviar.'}
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

        {/* ── Quick access ── */}
        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Accesos rápidos
            </Text>
            <Text className="text-xs text-subtle dark:text-subtle-dark">
              Captura voz sin abrir la aplicación
            </Text>
          </View>

          {visibleQuickAccess.map((item) => (
            <View key={item.id}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  item.tutorial
                    ? setExpandedQuickAccess(expandedQuickAccess === item.id ? null : item.id)
                    : null
                }
                className={`flex-row items-start gap-3 rounded-2xl bg-canvas p-3 dark:bg-canvas-dark ${
                  item.status === 'coming' ? 'opacity-60' : ''
                }`}>
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                  <Ionicons name={item.icon as never} size={20} color="#7C3AED" />
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="flex-1 text-[15px] font-medium text-foreground dark:text-foreground-dark">
                      {item.label}
                    </Text>
                    {item.status === 'coming' ? (
                      <Text className="text-xs text-subtle dark:text-subtle-dark">Próximamente</Text>
                    ) : null}
                  </View>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    {item.description}
                  </Text>
                </View>
                {item.tutorial ? (
                  <Ionicons
                    name={expandedQuickAccess === item.id ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6B6475"
                  />
                ) : null}
              </Pressable>

              {expandedQuickAccess === item.id && item.tutorial ? (
                <View className="mx-1 mt-1 gap-2 rounded-2xl border border-border bg-surface-soft p-4 dark:border-border-dark dark:bg-surface-soft-dark">
                  <Text className="text-xs font-semibold uppercase text-subtle dark:text-subtle-dark">
                    Cómo configurarlo
                  </Text>
                  {item.tutorial.steps.map((step, index) => (
                    <View key={index} className="flex-row gap-3">
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
                        <Text className="text-[10px] font-bold text-white">{index + 1}</Text>
                      </View>
                      <Text className="flex-1 text-xs leading-5 text-foreground dark:text-foreground-dark">
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* ── Integrations ── */}
        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowIntegrations((v) => !v)}
            className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Integraciones
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">
                WhatsApp, Calendario y más — próximamente
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
                  className="flex-row items-start gap-3 rounded-2xl bg-canvas p-3 dark:bg-canvas-dark">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                    <Ionicons name={item.icon} size={20} color="#7C3AED" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[15px] font-medium text-foreground dark:text-foreground-dark">
                      {item.label}
                    </Text>
                    <Text className="text-xs text-subtle dark:text-subtle-dark">
                      {item.description}
                    </Text>
                  </View>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">{item.status}</Text>
                </View>
              ))
            : null}
        </View>

        {/* ── Appearance ── */}
        <View className="gap-4 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Apariencia
          </Text>
          <ThemeToggle variant="cards" />
        </View>

        {/* ── Support ── */}
        <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Soporte
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL('mailto:soporte@kivo.app')}
            className="flex-row items-center gap-3 rounded-2xl bg-canvas p-4 active:opacity-75 dark:bg-canvas-dark">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
              <Ionicons name="mail-outline" size={20} color="#7C3AED" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                Contactar soporte
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">soporte@kivo.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B6475" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL('https://wa.me/+1234567890?text=Hola%2C%20necesito%20ayuda%20con%20Kivo')}
            className="flex-row items-center gap-3 rounded-2xl bg-canvas p-4 active:opacity-75 dark:bg-canvas-dark">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                WhatsApp soporte
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">
                Respuesta rápida por chat
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B6475" />
          </Pressable>
          <View className="flex-row items-center gap-3 rounded-2xl bg-canvas p-4 dark:bg-canvas-dark">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
              <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                Versión de la app
              </Text>
              <Text className="text-xs text-subtle dark:text-subtle-dark">1.0.0</Text>
            </View>
          </View>
        </View>

        {/* ── Sign out ── */}
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

