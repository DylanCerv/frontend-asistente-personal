import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { ChatBubble } from '@/components/chat-bubble';
import { InsightCard } from '@/components/insight-card';
import { KivoLogo } from '@/components/kivo-logo';
import { SecondaryNavLinks } from '@/components/secondary-nav-links';
import { APP_NAME } from '@/constants/branding';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceCapture } from '@/context/voice-capture-context';
import { buildInsights } from '@/services/insight-engine';
import type { InsightItem } from '@/types/insight';
import type { ChatMessage } from '@/types/assistant';

const SUGGESTIONS = [
  '¿Qué tengo hoy?',
  '¿Qué reuniones tengo mañana?',
  '¿Cuáles son mis tareas más importantes?',
  'Organízame la tarde',
];

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };
const COMPOSER_HEIGHT = 84;
const COLLAPSED_CHAT_MIN_HEIGHT = 308;
const COLLAPSED_CHAT_MAX_HEIGHT = 340;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function buildInsightHref(insight: InsightItem): string | { pathname: string; params: Record<string, string> } {
  if (insight.targetId && insight.targetKind === 'task') {
    return { pathname: '/agenda', params: { taskId: insight.targetId } };
  }
  if (insight.targetId && insight.targetKind === 'event') {
    return { pathname: '/agenda', params: { eventId: insight.targetId } };
  }

  switch (insight.action) {
    case 'agenda':
      return '/agenda';
    case 'finances':
      return '/finances';
    default:
      return '/(main)';
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const {
    tasks,
    events,
    reminders,
    records,
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
  const [input, setInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const didInitChatHeight = useRef(false);

  const minChatHeight = Math.round(
    Math.min(
      COLLAPSED_CHAT_MAX_HEIGHT,
      Math.max(COLLAPSED_CHAT_MIN_HEIGHT, containerHeight * 0.36 || COLLAPSED_CHAT_MIN_HEIGHT),
    ),
  );
  const maxChatHeight = Math.max(containerHeight, minChatHeight);
  const defaultChatHeight = minChatHeight;

  const chatHeight = useSharedValue(minChatHeight);
  const dragStartHeight = useSharedValue(minChatHeight);
  const minHeightSV = useSharedValue(minChatHeight);
  const maxHeightSV = useSharedValue(maxChatHeight);

  const insights = useMemo(
    () => buildInsights({ tasks, events, reminders, records }),
    [tasks, events, reminders, records],
  );

  const displayName = preferredName.trim() || user?.name || 'Usuario';
  const canSendText = input.trim().length > 0 && !isProcessing;
  const hasVisibleHomeContent =
    insights.length > 0 || tasks.length > 0 || events.length > 0 || reminders.length > 0;
  const shouldShowEmptyState = !isRecordsLoading && !recordsError && !hasVisibleHomeContent;

  useEffect(() => {
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      if (containerHeight > 0) {
        const target = Math.max(minChatHeight, Math.min(maxChatHeight, containerHeight - 8));
        chatHeight.value = withSpring(target, SPRING);
        setIsChatExpanded(true);
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [chatHeight, containerHeight, maxChatHeight, minChatHeight]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isProcessing]);

  useEffect(() => {
    if (containerHeight <= 0) return;
    minHeightSV.value = minChatHeight;
    maxHeightSV.value = maxChatHeight;

    if (keyboardHeight > 0) {
      chatHeight.value = withSpring(maxChatHeight, SPRING);
      dragStartHeight.value = maxChatHeight;
      setIsChatExpanded(true);
      return;
    }

    if (!didInitChatHeight.current) {
      didInitChatHeight.current = true;
      chatHeight.value = defaultChatHeight;
      dragStartHeight.value = defaultChatHeight;
    }
  }, [
    containerHeight,
    minChatHeight,
    maxChatHeight,
    defaultChatHeight,
    keyboardHeight,
    chatHeight,
    dragStartHeight,
    minHeightSV,
    maxHeightSV,
  ]);

  function updateExpandedState(height: number) {
    const mid = (minChatHeight + maxChatHeight) / 2;
    setIsChatExpanded(height >= mid);
  }

  function snapChatTo(target: number) {
    chatHeight.value = withSpring(target, SPRING);
    updateExpandedState(target);
  }

  function expandChatForConversation() {
    snapChatTo(maxChatHeight);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      dragStartHeight.value = chatHeight.value;
    })
    .onUpdate((event) => {
      const next = dragStartHeight.value - event.translationY;
      chatHeight.value = Math.min(maxHeightSV.value, Math.max(minHeightSV.value, next));
    })
    .onEnd((event) => {
      const current = chatHeight.value;
      const mid = (minHeightSV.value + maxHeightSV.value) / 2;
      let target = current > mid ? maxHeightSV.value : minHeightSV.value;

      if (event.velocityY < -900) {
        target = maxHeightSV.value;
      } else if (event.velocityY > 900) {
        target = minHeightSV.value;
      }

      chatHeight.value = withSpring(target, SPRING);
      runOnJS(updateExpandedState)(target);
    });

  const chatPanelStyle = useAnimatedStyle(() => ({
    height: Math.max(140, chatHeight.value - COMPOSER_HEIGHT),
  }));

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    expandChatForConversation();
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

  function handleInsightPress(insight: InsightItem) {
    if (!insight.action && !insight.targetId) return;
    const href = buildInsightHref(insight);
    if (typeof href === 'string') {
      router.push(href as '/agenda');
      return;
    }
    router.push(href as { pathname: '/agenda'; params: Record<string, string> });
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ScreenSafeArea edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          onLayout={(event) => {
            const nextHeight = Math.round(event.nativeEvent.layout.height);
            if (nextHeight > 0 && nextHeight !== containerHeight) {
              setContainerHeight(nextHeight);
            }
          }}>
          <ScrollView
            className="min-h-0 flex-1"
            contentContainerClassName="w-full max-w-3xl gap-4 self-center px-6 pb-4 pt-3"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || isRecordsLoading}
                onRefresh={handleRefresh}
                tintColor="#7C3AED"
                colors={['#7C3AED']}
              />
            }
            pointerEvents={isChatExpanded ? 'none' : 'auto'}>
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

            {shouldShowEmptyState ? (
              <View className="items-center gap-3 rounded-[28px] border border-dashed border-border bg-surface px-6 py-7 dark:border-border-dark dark:bg-surface-dark">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft dark:bg-surface-soft-dark">
                  <Ionicons name="sparkles-outline" size={24} color="#7C3AED" />
                </View>
                <View className="items-center gap-1">
                  <Text className="text-center text-base font-bold text-foreground dark:text-foreground-dark">
                    Aún no tienes tareas
                  </Text>
                  <Text className="text-center text-sm leading-5 text-subtle dark:text-subtle-dark">
                    Crea tu primera tarea hablando con Kivo o escribe algo como “recuérdame llamar mañana”.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openCapture({ autoStart: true })}
                  className="mt-1 flex-row items-center gap-2 rounded-full bg-brand px-4 py-2.5 active:opacity-85 dark:bg-brand-dark">
                  <Ionicons name="mic-outline" size={17} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white">Crear con voz</Text>
                </Pressable>
              </View>
            ) : null}

            {insights.length > 0 ? (
              <View className="gap-2">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} onPress={handleInsightPress} />
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Animated.View
            style={chatPanelStyle}
            className="overflow-hidden rounded-t-[28px] border border-border bg-surface/95 shadow-sm dark:border-border-dark dark:bg-surface-dark">
            <GestureDetector gesture={panGesture}>
              <View className="w-full max-w-3xl items-center self-center px-5 pb-2 pt-2">
                <View className="mb-2 h-1.5 w-12 rounded-full bg-border dark:bg-border-dark" />
                <View className="w-full flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-2">
                    <KivoLogo size={18} />
                    <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                      Chat con {APP_NAME}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isChatExpanded ? 'Reducir chat' : 'Agrandar chat'}
                    onPress={() =>
                      snapChatTo(isChatExpanded ? minChatHeight : maxChatHeight)
                    }
                    className="min-h-9 flex-row items-center gap-1.5 rounded-full border border-brand/15 bg-surface-soft px-3 py-1.5 active:opacity-85 dark:bg-surface-soft-dark">
                    <Ionicons
                      name={isChatExpanded ? 'chevron-down' : 'chevron-up'}
                      size={16}
                      color="#7C3AED"
                    />
                    <Text className="text-xs font-semibold text-brand dark:text-brand-dark">
                      {isChatExpanded ? 'Reducir' : 'Agrandar'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              className="flex-1"
              contentContainerClassName="w-full max-w-3xl gap-3 self-center px-5 pb-3 pt-1"
              showsVerticalScrollIndicator={false}
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

            {messages.length <= 1 ? (
              <View className="w-full max-w-3xl flex-row flex-wrap gap-2 self-center px-5 pb-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    onPress={() => {
                      expandChatForConversation();
                      void sendTextMessage(suggestion);
                    }}
                    className="rounded-full border border-border bg-surface px-3 py-2 active:opacity-80 dark:border-border-dark dark:bg-surface-dark">
                    <Text className="text-xs font-medium text-brand dark:text-brand-dark">
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

          </Animated.View>

          <View
            className="w-full max-w-3xl self-center border-t border-border bg-canvas px-4 pt-3 dark:border-border-dark dark:bg-canvas-dark"
            style={{
              paddingBottom: keyboardHeight > 0 ? 8 : 10,
            }}>
            <View className="flex-row items-end gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Grabar audio"
                onPress={() => openCapture({ autoStart: true })}
                disabled={isProcessing}
                className="mb-1 h-11 w-11 items-center justify-center rounded-2xl bg-brand active:opacity-85 disabled:opacity-50 dark:bg-brand-dark">
                <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
              </Pressable>

              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#6B6475"
                multiline
                textAlignVertical="center"
                className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-border bg-surface px-4 py-2.5 text-[15px] leading-5 text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark"
                onFocus={() => {
                  setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje"
                onPress={handleSend}
                disabled={!canSendText}
                className={`mb-1 h-11 w-11 items-center justify-center rounded-full active:opacity-85 ${
                  canSendText
                    ? 'bg-brand dark:bg-brand-dark'
                    : 'bg-brand/25 dark:bg-brand-dark/25'
                }`}>
                <Ionicons name="send" size={20} color={canSendText ? '#FFFFFF' : '#7C3AED'} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
    </GestureHandlerRootView>
  );
}
