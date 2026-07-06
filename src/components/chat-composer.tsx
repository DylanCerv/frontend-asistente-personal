import Ionicons from '@react-native-vector-icons/ionicons';
import type { RefObject } from 'react';
import { Pressable, TextInput, View, type TextInput as TextInputType } from 'react-native';

/** Approximate fixed height used for chat panel layout math (bar + padding). */
export const CHAT_COMPOSER_LAYOUT_HEIGHT = 72;

export function getChatComposerTotalHeight(bottomPadding: number): number {
  return CHAT_COMPOSER_LAYOUT_HEIGHT + bottomPadding;
}

type ChatComposerProps = {
  inputRef?: RefObject<TextInputType | null>;
  input: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  canSend: boolean;
  bottomPadding: number;
};

export function ChatComposer({
  inputRef,
  input,
  onChangeText,
  onSend,
  onFocus,
  onBlur,
  disabled = false,
  canSend,
  bottomPadding,
}: ChatComposerProps) {
  return (
    <View
      className="w-full max-w-3xl self-center border-t border-border bg-surface px-4 pt-3 dark:border-border-dark dark:bg-surface-dark"
      style={{ paddingBottom: bottomPadding }}>
      <View className="flex-row items-end gap-2.5">
        <View className="min-h-[48px] flex-1 flex-row items-end rounded-[24px] border border-border bg-canvas px-1 dark:border-border-dark dark:bg-canvas-dark">
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={onChangeText}
            placeholder="O escribe si prefieres..."
            placeholderTextColor="#6B6475"
            multiline
            maxLength={2000}
            editable={!disabled}
            textAlignVertical="top"
            className="max-h-28 min-h-[48px] flex-1 px-3 py-2.5 text-[15px] leading-5 text-foreground dark:text-foreground-dark"
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSend}
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          onPress={onSend}
          disabled={!canSend}
          className="mb-0.5 h-12 w-12 items-center justify-center rounded-full bg-brand active:opacity-85 disabled:opacity-45 dark:bg-brand-dark"
          style={{ opacity: canSend ? 1 : 0.35 }}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
