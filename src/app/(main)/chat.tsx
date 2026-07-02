import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { useAssistant } from '@/context/assistant-context';
import { useVoiceCapture } from '@/context/voice-capture-context';

const SUGGESTIONS = [
  '¿Qué tengo hoy?',
  '¿Qué reuniones tengo mañana?',
  '¿Cuáles son mis tareas más importantes?',
  'Organízame la tarde',
];

export default function ChatScreen() {
  const { messages, isProcessing, processingStep, sendTextMessage, addWelcomeMessage } =
    useAssistant();
  const { openCapture } = useVoiceCapture();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

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

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View className="border-b border-border px-6 py-3 dark:border-border-dark">
          <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
            Conversar
          </Text>
          <Text className="text-sm text-subtle dark:text-subtle-dark">
            Pregunta, pide recordatorios o habla naturalmente
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 px-6 py-4 pb-4"
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={
            isProcessing ? (
              <View className="flex-row items-center gap-2 self-start rounded-2xl border border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text className="text-sm text-subtle dark:text-subtle-dark">
                  {processingStep === 'transcribing' ? 'Transcribiendo audio...' : 'Pensando...'}
                </Text>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 ? (
          <View className="flex-row flex-wrap gap-2 px-6 pb-3">
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

        <View className="flex-row items-end gap-2 border-t border-border px-4 py-3 pb-28 dark:border-border-dark">
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
    </SafeAreaView>
  );
}
