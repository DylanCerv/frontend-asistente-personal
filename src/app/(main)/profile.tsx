import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ProfileSettingsSheet,
  type ProfileSheetType,
} from '@/components/profile-settings-sheet';
import { KivoAlertsSheet } from '@/components/kivo-alerts/kivo-alerts-sheet';
import { KivoWordmark } from '@/components/kivo-wordmark';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import { WidgetSetupSheet } from '@/components/widget-setup-sheet';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_VERSION_LABEL } from '@/constants/branding';
import { useAppFlow } from '@/context/app-flow-context';
import { useAuth } from '@/context/auth-context';
import { useDeviceCalendar } from '@/context/device-calendar-context';
import { useSubscription } from '@/context/subscription-context';
import { useUserPreferences, HOME_WIDGET_SETUP_PENDING_KEY } from '@/context/user-preferences-context';
import { showAppAlert } from '@/services/app-dialog';
import { canUseDeviceCalendar } from '@/services/calendar/device-calendar';
import { getFocusLockIntensityShortLabel } from '@/services/focus/focus-lock-intensity';
import { uploadAvatar } from '@/services/profiles/avatar-upload';

const TEAL = '#2DD4BF';
const CORAL = '#FF7A5C';
const TAB_BAR_CLEARANCE = 92;

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
    id: 'deep-link',
    icon: 'link-outline',
    label: 'Atajo del sistema (Samsung/Siri)',
    description: 'kivo://capture — abre la captura de voz desde atajos del sistema.',
    status: 'available',
    tutorial: {
      platform: 'both',
      steps:
        Platform.OS === 'android'
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
];

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp',
    description: 'Comparte reportes y registros por WhatsApp.',
    status: 'Próximamente',
  },
  {
    id: 'gmail',
    icon: 'mail-outline' as const,
    label: 'Correo',
    description: 'Recibe resúmenes diarios por Gmail u Outlook.',
    status: 'Próximamente',
  },
] as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[1.2px]"
      style={{ color: APP_ACCENT }}>
      {children}
    </Text>
  );
}

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
      {children}
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isLast,
  trailing,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  trailing?: ReactNode;
}) {
  const content = (
    <View
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: APP_BORDER } : undefined}>
      <Ionicons name={icon} size={20} color={APP_ACCENT} />
      <Text className="flex-1 text-[15px] font-medium text-white">{label}</Text>
      {trailing ?? (
        <View className="flex-row items-center gap-1.5">
          {value ? (
            <Text className="text-sm" style={{ color: APP_TEXT_MUTED }}>
              {value}
            </Text>
          ) : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color={APP_TEXT_MUTED} /> : null}
        </View>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      {content}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, updateAvatar } = useAuth();
  const { resetFlow } = useAppFlow();
  const {
    autoSendVoice,
    setAutoSendVoice,
    preferredName,
    homeWidgetEnabled,
    setHomeWidgetEnabled,
    deviceCalendarSyncEnabled,
    setDeviceCalendarSyncEnabled,
    focusLockIntensity,
  } = useUserPreferences();
  const { enableDeviceCalendarSync, refreshDeviceCalendar } = useDeviceCalendar();
  const { plan, planId } = useSubscription();
  const [activeSheet, setActiveSheet] = useState<ProfileSheetType>(null);
  const [showKivoAlerts, setShowKivoAlerts] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [expandedQuickAccess, setExpandedQuickAccess] = useState<string | null>(null);
  const [showWidgetSetup, setShowWidgetSetup] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isTogglingCalendar, setIsTogglingCalendar] = useState(false);

  useEffect(() => {
    setAvatarUri(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  const isAndroid = Platform.OS === 'android';
  const isIos = Platform.OS === 'ios';
  const isPro = planId === 'pro';
  const displayName = preferredName.trim() || user?.name || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = isPro ? 'PRO MEMBER' : 'FREE MEMBER';
  const subtitleLine = `ASISTENTE PERSONAL  •  ${planLabel}`;

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
    if (item.tutorial?.platform === 'android' && !isAndroid) return false;
    if (item.tutorial?.platform === 'ios' && !isIos) return false;
    return true;
  });

  function handleSignOut() {
    void resetFlow();
    signOut();
    router.replace('/login');
  }

  function handleHelp() {
    void Linking.openURL('mailto:soporte@kivo.app');
  }

  const proFeatures = isPro
    ? plan.features.slice(0, 2)
    : ['Captura por voz (beta)', 'Chat con IA (beta)'];

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
      <ScreenSafeArea edges={['top']}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
            gap: 22,
          }}>
          {/* Header */}
          <View className="flex-row items-center">
            <KivoWordmark size={22} />
          </View>

          {/* Identity */}
          <View className="items-center gap-3 pt-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              onPress={handlePickAvatar}
              className="relative">
              <View
                className="h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full"
                style={{
                  borderWidth: 3,
                  borderColor: TEAL,
                  shadowColor: TEAL,
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                  backgroundColor: APP_SURFACE_SOFT,
                }}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 104, height: 104 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-4xl font-bold text-white">{initial}</Text>
                )}
              </View>
              <View
                className="absolute bottom-0.5 right-0.5 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: APP_ACCENT }}>
                <Ionicons
                  name={isUploadingAvatar ? 'time-outline' : 'pencil'}
                  size={14}
                  color={APP_ON_ACCENT}
                />
              </View>
            </Pressable>

            <View className="items-center gap-1.5">
              <Text className="text-[28px] font-bold tracking-tight text-foreground">
                {displayName}
              </Text>
              <Text
                className="text-center text-[11px] font-medium uppercase tracking-[1.4px]"
                style={{ color: APP_TEXT_MUTED }}>
                {subtitleLine}
              </Text>
            </View>
          </View>

          {/* Plan card */}
          <View
            className="gap-4 rounded-2xl p-5"
            style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-2">
                <Ionicons name="ribbon-outline" size={20} color={APP_ACCENT} />
                <Text className="text-base font-bold" style={{ color: APP_ACCENT }}>
                  {isPro ? 'Kivo Pro' : 'Kivo Free'}
                </Text>
              </View>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: APP_SURFACE_SOFT, borderWidth: 1, borderColor: APP_BORDER }}>
                <Text className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                  {isPro ? 'Activo' : 'Beta'}
                </Text>
              </View>
            </View>

            <Text className="text-sm leading-5" style={{ color: APP_TEXT_MUTED }}>
              {isPro
                ? `${plan.priceLabel} • Acceso completo`
                : 'Sin límite durante la beta • Actualiza cuando quieras'}
            </Text>

            <View className="gap-2.5">
              {proFeatures.map((feature) => (
                <View key={feature} className="flex-row items-center gap-2.5">
                  <Ionicons name="checkmark-circle" size={18} color={TEAL} />
                  <Text className="flex-1 text-sm text-foreground">{feature}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveSheet('subscription')}
              className="min-h-[48px] items-center justify-center rounded-2xl active:opacity-90"
              style={{ backgroundColor: APP_ACCENT }}>
              <Text className="text-[15px] font-bold" style={{ color: APP_ON_ACCENT }}>
                Gestionar Plan
              </Text>
            </Pressable>
          </View>

          {/* Personalización */}
          <View>
            <SectionLabel>Personalización</SectionLabel>
            <SettingsCard>
              <SettingsRow
                icon="pulse-outline"
                label="Envío automático de voz"
                value={autoSendVoice ? 'Activado' : 'Manual'}
                onPress={() => setAutoSendVoice(!autoSendVoice)}
              />
              <SettingsRow
                icon="locate-outline"
                label="Modo Focus"
                value={getFocusLockIntensityShortLabel(focusLockIntensity)}
                onPress={() => setActiveSheet('focus')}
              />
              <SettingsRow
                icon="person-outline"
                label="Datos personales"
                value={preferredName.trim() || user?.name || undefined}
                onPress={() => setActiveSheet('personal')}
                isLast
              />
            </SettingsCard>
          </View>

          {/* Organización */}
          <View>
            <SectionLabel>Organización</SectionLabel>
            <SettingsCard>
              <SettingsRow
                icon="notifications-outline"
                label="Notificaciones"
                onPress={() => setActiveSheet('notifications')}
              />
              <SettingsRow
                icon="flash-outline"
                label="Alertas Kivo"
                onPress={() => setShowKivoAlerts(true)}
              />
              <SettingsRow
                icon="calendar-outline"
                label="Sincronización de calendario"
                value={deviceCalendarSyncEnabled ? 'Activa' : 'Apagada'}
                trailing={
                  <Switch
                    value={deviceCalendarSyncEnabled}
                    disabled={isTogglingCalendar}
                    onValueChange={(value) => {
                      void (async () => {
                        setIsTogglingCalendar(true);
                        try {
                          if (!value) {
                            await setDeviceCalendarSyncEnabled(false);
                            return;
                          }
                          if (!canUseDeviceCalendar()) {
                            showAppAlert(
                              'Build nativo requerido',
                              'La sincronización del calendario del teléfono funciona en APK / dev client (EXPO_PUBLIC_NATIVE_BUILD=1), no en Expo Go.',
                            );
                            return;
                          }
                          const ok = await enableDeviceCalendarSync();
                          if (!ok) {
                            showAppAlert(
                              'Permiso requerido',
                              'Sin acceso al calendario del celular, Kivo no puede importar tus reuniones.',
                            );
                            return;
                          }
                          await refreshDeviceCalendar(true);
                        } finally {
                          setIsTogglingCalendar(false);
                        }
                      })();
                    }}
                    trackColor={{ false: '#2A2A2A', true: APP_ACCENT }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
              <SettingsRow
                icon="git-network-outline"
                label="Conexiones e integraciones"
                value={showIntegrations ? 'Ver' : 'Próximamente'}
                onPress={() => setShowIntegrations((v) => !v)}
                isLast={!showIntegrations}
              />
              {showIntegrations
                ? INTEGRATIONS.map((item, index) => (
                    <View
                      key={item.id}
                      className="flex-row items-center gap-3 px-4 py-3.5"
                      style={
                        index < INTEGRATIONS.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: APP_BORDER }
                          : undefined
                      }>
                      <Ionicons name={item.icon} size={18} color={APP_TEXT_MUTED} />
                      <View className="flex-1 gap-0.5">
                        <Text className="text-[14px] font-medium text-foreground">{item.label}</Text>
                        <Text className="text-xs" style={{ color: APP_TEXT_MUTED }}>
                          {item.description}
                        </Text>
                      </View>
                      <Text className="text-[11px]" style={{ color: APP_TEXT_MUTED }}>
                        {item.status}
                      </Text>
                    </View>
                  ))
                : null}
            </SettingsCard>
          </View>

          {/* Widgets & shortcuts */}
          <View>
            <SectionLabel>
              {isAndroid ? 'Integración Android' : isIos ? 'Integración iOS' : 'Accesos rápidos'}
            </SectionLabel>
            <View
              className="gap-4 rounded-2xl p-4"
              style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
              <View className="flex-row items-start gap-3">
                <View
                  className="h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)' }}>
                  <Ionicons name="grid-outline" size={22} color={TEAL} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[15px] font-bold text-foreground">Widgets y atajos</Text>
                  <Text className="text-sm leading-5" style={{ color: APP_TEXT_MUTED }}>
                    Cuatro widgets oscuros en tu pantalla de inicio: agenda, prioridad, captura
                    rápida y focus points.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-[14px] font-medium text-foreground">
                  Widgets de inicio
                </Text>
                <Switch
                  value={homeWidgetEnabled}
                  onValueChange={(value) => {
                    void setHomeWidgetEnabled(value);
                    if (value) setShowWidgetSetup(true);
                  }}
                  trackColor={{ false: '#2A2A2A', true: APP_ACCENT }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowWidgetSetup(true)}
                className="flex-row items-center gap-1.5 active:opacity-80">
                <Text className="text-sm font-semibold" style={{ color: APP_ACCENT }}>
                  Configurar widgets
                </Text>
                <Ionicons name="open-outline" size={14} color={APP_ACCENT} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowQuickAccess((v) => !v)}
                className="flex-row items-center justify-between active:opacity-80">
                <Text className="text-sm font-medium" style={{ color: APP_TEXT_MUTED }}>
                  Ver tutoriales de acceso rápido
                </Text>
                <Ionicons
                  name={showQuickAccess ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={APP_TEXT_MUTED}
                />
              </Pressable>

              {showQuickAccess
                ? visibleQuickAccess.map((item) => (
                    <View key={item.id} className="gap-2">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          item.tutorial
                            ? setExpandedQuickAccess(
                                expandedQuickAccess === item.id ? null : item.id,
                              )
                            : null
                        }
                        className="flex-row items-start gap-3 active:opacity-80">
                        <Ionicons name={item.icon as never} size={18} color="#FFFFFF" />
                        <View className="flex-1 gap-0.5">
                          <Text className="text-[14px] font-medium text-foreground">
                            {item.label}
                          </Text>
                          <Text className="text-xs leading-4" style={{ color: APP_TEXT_MUTED }}>
                            {item.description}
                          </Text>
                        </View>
                        {item.tutorial ? (
                          <Ionicons
                            name={
                              expandedQuickAccess === item.id ? 'chevron-up' : 'chevron-down'
                            }
                            size={16}
                            color={APP_TEXT_MUTED}
                          />
                        ) : null}
                      </Pressable>

                      {expandedQuickAccess === item.id && item.tutorial ? (
                        <View
                          className="ml-7 gap-2 rounded-xl p-3"
                          style={{ backgroundColor: APP_SURFACE_SOFT }}>
                          {item.tutorial.steps.map((step, index) => (
                            <View key={index} className="flex-row gap-2.5">
                              <Text
                                className="text-xs font-bold"
                                style={{ color: APP_ACCENT }}>
                                {index + 1}.
                              </Text>
                              <Text
                                className="flex-1 text-xs leading-5"
                                style={{ color: APP_TEXT_MUTED }}>
                                {step}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          </View>

          {/* Seguridad */}
          <View>
            <SectionLabel>Seguridad y Datos</SectionLabel>
            <SettingsCard>
              <SettingsRow
                icon="lock-closed-outline"
                label="Privacidad y seguridad"
                onPress={() => setActiveSheet('security')}
              />
              <SettingsRow
                icon="download-outline"
                label="Exportar historial"
                value="Próximamente"
                isLast
              />
            </SettingsCard>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={handleHelp}
              className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl active:opacity-80"
              style={{ borderWidth: 1, borderColor: APP_BORDER, backgroundColor: APP_SURFACE }}>
              <Ionicons name="help-circle-outline" size={18} color="#FFFFFF" />
              <Text className="text-[14px] font-semibold text-foreground">Ayuda</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleSignOut}
              className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl active:opacity-80"
              style={{ borderWidth: 1, borderColor: 'rgba(255, 122, 92, 0.35)', backgroundColor: APP_SURFACE }}>
              <Ionicons name="log-out-outline" size={18} color={CORAL} />
              <Text className="text-[14px] font-semibold" style={{ color: CORAL }}>
                Cerrar sesión
              </Text>
            </Pressable>
          </View>

          <Text
            className="pb-2 text-center text-[11px]"
            style={{ color: APP_TEXT_MUTED }}>
            {APP_VERSION_LABEL}
          </Text>
        </ScrollView>
      </ScreenSafeArea>

      <ProfileSettingsSheet type={activeSheet} onClose={() => setActiveSheet(null)} />
      <KivoAlertsSheet visible={showKivoAlerts} onClose={() => setShowKivoAlerts(false)} />
      <WidgetSetupSheet visible={showWidgetSetup} onClose={() => setShowWidgetSetup(false)} />
    </View>
  );
}
