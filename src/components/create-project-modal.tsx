import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenSafeArea } from '@/components/screen-safe-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/text-input';
import { showAppAlert } from '@/services/app-dialog';
import { createProject } from '@/services/projects/projects-api';

export function CreateProjectModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await createProject({
        title: trimmed,
        description: description.trim() || null,
      });
      setTitle('');
      setDescription('');
      onCreated?.();
      onClose();
    } catch (error) {
      showAppAlert(
        'No se pudo crear el proyecto',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScreenSafeArea>
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4 dark:border-border-dark">
          <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">
            Nuevo proyecto
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B6475" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-5 p-5 pb-10">
          <Input
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Qhiro Symbiotic"
            autoCapitalize="sentences"
          />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
            placeholder="De qué trata, sector, notas…"
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
          <Button
            label={isSaving ? 'Creando...' : 'Crear proyecto'}
            onPress={() => void handleSave()}
            disabled={!title.trim() || isSaving}
          />
        </ScrollView>
      </ScreenSafeArea>
    </Modal>
  );
}
