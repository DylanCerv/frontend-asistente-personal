import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenSafeArea, useBottomInset } from '@/components/screen-safe-area';

import { ChatBubble } from '@/components/chat-bubble';
import { InsightCard } from '@/components/insight-card';
import { SecondaryNavLinks } from '@/components/secondary-nav-links';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useVoiceCapture } from '@/context/voice-capture-context';
import { buildInsights } from '@/services/insight-engine';
import type { InsightAction, InsightItem } from '@/types/insight';
import type { ChatMessage } from '@/types/assistant';

const SUGGESTIONS = [
  '¿Qué tengo hoy?',
  '¿Qué reuniones tengo mañana?',
  '¿Cuáles son mis tareas más importantes?',
  'Organízame la tarde',
];

const INSIGHT_ROUTES: Record<InsightAction, string> = {
  agenda: '/agenda',
  finances: '/finances',
  memory: '/memory',
  chat: '/',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    tasks,
    events,
    reminders,
    records,
    messages,
    isMockMode,
    isProcessing,
    processingStep,
    sendTextMessage,
    addWelcomeMessage,
  } = useAssistant();
  const { openCapture } = useVoiceCapture();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const bottomInset = useBottomInset();

  const insights = useMemo(
    () => buildInsights({ tasks, events, reminders, records }),
    [tasks, events, reminders, records],
  );

  useEffect(() => {
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isProcessing]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendTextMessage(text);
  }

  function handleInsightPress(insight: InsightItem) {
    if (!insight.action) return;
    router.push(INSIGHT_ROUTES[insight.action] as '/agenda');
  }

  function renderHeader() {
    return (
      <View className="gap-5 pb-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-[15px] text-subtle dark:text-subtle-dark">{getGreeting()},</Text>
            <Text className="text-[28px] font-bold text-foreground dark:text-foreground-dark">
              {user?.name ?? 'Usuario'}
            </Text>
            {isMockMode ? (
              <Text className="text-xs text-brand dark:text-brand-dark">
                Modo demo local — sin Supabase
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            onPress={() => router.push('/profile')}
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface active:opacity-85 dark:border-border-dark dark:bg-surface-dark">
            <Ionicons name="settings-outline" size={22} color="#7C3AED" />
          </Pressable>
        </View>

        {insights.length > 0 ? (
          <View className="gap-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} onPress={handleInsightPress} />
            ))}
          </View>
        ) : null}

        <SecondaryNavLinks />

        {messages.length > 0 ? (
          <Text className="text-sm font-semibold text-subtle dark:text-subtle-dark">
            Conversación
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <ScreenSafeArea edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="w-full max-w-3xl gap-4 self-center px-6 pb-4 pt-3"
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={
            isProcessing ? (
              <View className="flex-row items-center gap-2 self-start rounded-2xl border border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text className="text-sm text-subtle dark:text-subtle-dark">
                  {processingStep === 'uploading'
                    ? 'Subiendo audio...'
                    : processingStep === 'transcribing'
                      ? 'Procesando audio...'
                      : 'Pensando...'}
                </Text>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 ? (
          <View className="w-full max-w-3xl flex-row flex-wrap gap-2 self-center px-6 pb-3">
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => sendTextMessage(suggestion)}
                className="rounded-full border border-border bg-surface px-3 py-2 active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                <Text className="text-xs font-medium text-brand dark:text-brand-dark">
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View
          className="w-full max-w-3xl flex-row items-end gap-2 self-center border-t border-border bg-canvas px-4 pt-3 dark:border-border-dark dark:bg-canvas-dark"
          style={{ paddingBottom: bottomInset }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar audio"
            onPress={() => openCapture({ autoStart: true })}
            className="mb-1 items-center justify-center gap-0.5 rounded-2xl border border-brand/30 bg-surface-soft px-2.5 py-1.5 active:opacity-85 dark:border-brand-dark/30 dark:bg-surface-soft-dark">
            <Ionicons name="mic" size={22} color="#7C3AED" />
            <Text className="text-[10px] font-semibold text-brand dark:text-brand-dark">Audio</Text>
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe o habla..."
            placeholderTextColor="#6B6475"
            multiline
            className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-border bg-surface px-4 py-2.5 text-[15px] text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <Pressable
            accessibilityRole="button"
            onPress={handleSend}
            disabled={!input.trim() || isProcessing}
            className={`mb-1 h-11 w-11 items-center justify-center rounded-full active:opacity-85 ${
              input.trim() ? 'bg-brand dark:bg-brand-dark' : 'bg-muted dark:bg-muted-dark'
            }`}>
            <Ionicons name="send" size={20} color={input.trim() ? '#FFFFFF' : '#6B6475'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
