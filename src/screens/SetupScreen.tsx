import Ionicons from '@react-native-vector-icons/ionicons';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';

type SetupStep = 'name' | 'calendar' | 'permissions';

type SetupScreenProps = {
  onComplete: (displayName: string) => void;
  initialName?: string;
};

const PERMISSIONS = [
  { id: 'mic', icon: 'mic-outline' as const, label: 'Micrófono', description: 'Para capturar tus ideas por voz', required: true },
  { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notificaciones', description: 'Para recordarte a tiempo', required: true },
  { id: 'calendar', icon: 'calendar-outline' as const, label: 'Calendario', description: 'Para sincronizar tus eventos', required: false },
  { id: 'location', icon: 'location-outline' as const, label: 'Ubicación', description: 'Para recordatorios contextuales', required: false },
] as const;

export function SetupScreen({ onComplete, initialName = '' }: SetupScreenProps) {
  const [step, setStep] = useState<SetupStep>('name');
  const [displayName, setDisplayName] = useState(initialName);
  const [importCalendar, setImportCalendar] = useState<boolean | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());

  async function requestMicPermission() {
    const result = await requestRecordingPermissionsAsync();
    if (result.granted) {
      setGrantedPermissions((prev) => new Set(prev).add('mic'));
    } else {
      Alert.alert('Permiso requerido', 'El micrófono es esencial para usar el asistente por voz.');
    }
  }

  function togglePermission(id: string) {
    if (id === 'mic') {
      requestMicPermission();
      return;
    }
    setGrantedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleNameContinue() {
    if (!displayName.trim()) return;
    setStep('calendar');
  }

  function handleCalendarChoice(importCal: boolean) {
    setImportCalendar(importCal);
    setStep('permissions');
  }

  function handleFinish() {
    onComplete(displayName.trim());
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="flex-1 justify-center px-6">
        <View className="w-full max-w-md gap-8 self-center">
          {step === 'name' ? (
            <>
              <View className="items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
                  <Ionicons name="happy-outline" size={32} color="#7C3AED" />
                </View>
                <Text className="text-center text-[26px] font-bold text-foreground dark:text-foreground-dark">
                  ¿Cómo quieres que te llame?
                </Text>
                <Text className="text-center text-base text-subtle dark:text-subtle-dark">
                  Tu asistente personal te hablará así.
                </Text>
              </View>
              <Input
                label="Tu nombre"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Carlos"
                autoCapitalize="words"
                autoFocus
              />
              <Button
                label="Continuar"
                onPress={handleNameContinue}
                disabled={!displayName.trim()}
              />
            </>
          ) : null}

          {step === 'calendar' ? (
            <>
              <View className="items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
                  <Ionicons name="calendar-outline" size={32} color="#7C3AED" />
                </View>
                <Text className="text-center text-[26px] font-bold text-foreground dark:text-foreground-dark">
                  ¿Quieres importar tu calendario?
                </Text>
                <Text className="text-center text-base text-subtle dark:text-subtle-dark">
                  Sincroniza tus eventos para que la IA los conozca.
                </Text>
              </View>
              <View className="gap-3">
                <Button label="Sí, importar" onPress={() => handleCalendarChoice(true)} />
                <Button
                  label="Ahora no"
                  variant="secondary"
                  onPress={() => handleCalendarChoice(false)}
                />
              </View>
            </>
          ) : null}

          {step === 'permissions' ? (
            <>
              <View className="items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
                  <Ionicons name="shield-checkmark-outline" size={32} color="#7C3AED" />
                </View>
                <Text className="text-center text-[26px] font-bold text-foreground dark:text-foreground-dark">
                  Permisos
                </Text>
                <Text className="text-center text-base text-subtle dark:text-subtle-dark">
                  Para que tu asistente funcione en todas partes.
                </Text>
              </View>

              <View className="gap-3">
                {PERMISSIONS.map((perm) => {
                  const isGranted = grantedPermissions.has(perm.id);
                  return (
                    <Pressable
                      key={perm.id}
                      accessibilityRole="button"
                      onPress={() => togglePermission(perm.id)}
                      className={`flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80 ${
                        isGranted
                          ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                          : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                      }`}>
                      <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                        <Ionicons
                          name={perm.icon}
                          size={22}
                          color={isGranted ? '#7C3AED' : '#6B6475'}
                        />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                          {perm.label}
                          {!perm.required ? ' (opcional)' : ''}
                        </Text>
                        <Text className="text-xs text-subtle dark:text-subtle-dark">
                          {perm.description}
                        </Text>
                      </View>
                      <Ionicons
                        name={isGranted ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isGranted ? '#7C3AED' : '#6B6475'}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {importCalendar !== null ? (
                <Text className="text-center text-xs text-subtle dark:text-subtle-dark">
                  {importCalendar
                    ? 'Tu calendario se importará en segundo plano.'
                    : 'Puedes importar tu calendario después desde Perfil.'}
                </Text>
              ) : null}

              <Button label="Empezar a usar el asistente" onPress={handleFinish} />
            </>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
