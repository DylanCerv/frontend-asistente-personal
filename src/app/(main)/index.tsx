import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { KivoLogo } from '@/components/kivo-logo';
import { ScreenSafeArea, getComposerBottomPadding } from '@/components/screen-safe-area';
import { SecondaryNavLinks } from '@/components/secondary-nav-links';
import { APP_NAME } from '@/constants/branding';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceCapture } from '@/context/voice-capture-context';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import type { ChatMessage } from '@/types/assistant';

const SUGGESTION_CHIPS = [
  '¿Qué tengo hoy?',
  'Recordarme algo',
  'Mi agenda de mañana',
  'Organizar mi tarde',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const {
    messages,
    isRecordsLoading,
    recordsError,
    isProcessing,
    processingStep,
    refreshRecords,
    sendTextMessage,
    addWelcomeMessage,
  } = useAssistant();
  const { openCapture } = useVoiceCapture();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const composerBottomPadding = getComposerBottomPadding(insets.bottom, keyboardHeight);

  const [input, setInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);

  const displayName = preferredName.trim() || user?.name || 'Usuario';
  const canSendText = input.trim().length > 0 && !isProcessing;
  const showSuggestions = messages.length <= 1;

  useEffect(() => {
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  function scrollChatToEnd(delayMs = 80) {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), delayMs);
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollChatToEnd(100);
    }
  }, [messages.length, isProcessing]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollChatToEnd(120);
    }
  }, [keyboardHeight]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendTextMessage(text);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refreshRecords();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSuggestionPress(label: string) {
    void sendTextMessage(label);
  }

  const chatSection = (
    <View className="min-h-0 flex-1">
      <View className="min-h-0 flex-1 overflow-hidden rounded-t-[28px] border border-border bg-surface/95 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <View className="w-full max-w-3xl self-center px-5 pb-2 pt-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <KivoLogo size={18} />
                <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                  Chat con {APP_NAME}
                </Text>
              </View>
              <Text className="px-0.5 text-[11px] text-subtle dark:text-subtle-dark">
                Habla con el micrófono
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Grabar audio"
              onPress={() => openCapture({ autoStart: true })}
              className="h-11 flex-row items-center gap-2 rounded-full bg-brand px-4 active:opacity-85 dark:bg-brand-dark">
              <Ionicons name="mic" size={18} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">Hablar</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerClassName="w-full max-w-3xl gap-3 self-center px-5 pb-2 pt-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || isRecordsLoading}
              onRefresh={handleRefresh}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={
            isProcessing ? (
              <View className="flex-row items-center gap-2 self-start rounded-2xl border border-border bg-canvas px-4 py-3 dark:border-border-dark dark:bg-canvas-dark">
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text className="text-sm text-subtle dark:text-subtle-dark">
                  {processingStep === 'transcribing' || processingStep === 'uploading'
                    ? 'Un momento...'
                    : 'Pensando...'}
                </Text>
              </View>
            ) : null
          }
        />

        {showSuggestions ? (
          <View className="w-full max-w-3xl flex-row flex-wrap gap-2 self-center px-5 pb-2">
            {SUGGESTION_CHIPS.map((label) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={`Sugerencia: ${label}`}
                onPress={() => handleSuggestionPress(label)}
                className="rounded-full border border-border bg-surface px-3 py-2 active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                <Text className="text-xs font-medium text-brand dark:text-brand-dark">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <ChatComposer
        inputRef={inputRef}
        input={input}
        onChangeText={setInput}
        onSend={handleSend}
        onFocus={() => scrollChatToEnd(120)}
        disabled={isProcessing}
        canSend={canSendText}
        bottomPadding={composerBottomPadding}
      />
    </View>
  );

  return (
    <View className="flex-1">
      <ScreenSafeArea edges={['top']}>
        <View className="flex-1">
          <View className="w-full max-w-3xl gap-4 self-center px-6 pb-3 pt-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-[15px] text-subtle dark:text-subtle-dark">
                  {getGreeting()},
                </Text>
                <Text className="text-[28px] font-bold text-foreground dark:text-foreground-dark">
                  {displayName}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Perfil"
                onPress={() => router.push('/profile')}
                className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface active:opacity-85 dark:border-border-dark dark:bg-surface-dark">
                <Ionicons name="settings-outline" size={22} color="#7C3AED" />
              </Pressable>
            </View>

            <SecondaryNavLinks />

            {recordsError ? (
              <View className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
                <Text className="text-sm text-danger dark:text-danger-dark">{recordsError}</Text>
              </View>
            ) : null}
          </View>

          <KeyboardAvoidingView
            className="min-h-0 flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
            {chatSection}
          </KeyboardAvoidingView>
        </View>
      </ScreenSafeArea>
    </View>
  );
}
