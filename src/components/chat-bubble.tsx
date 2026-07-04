import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_NAME } from '@/constants/branding';
import type { ChatMessage } from '@/types/assistant';

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`max-w-[85%] gap-1 ${isUser ? 'self-end' : 'self-start'}`}>
      {!isUser ? (
        <View className="mb-0.5 flex-row items-center gap-1.5 px-1">
          <KivoLogo size={16} />
          <Text className="text-[11px] font-semibold text-subtle dark:text-subtle-dark">
            {APP_NAME}
          </Text>
        </View>
      ) : null}
      <View
        className={`rounded-[20px] px-4 py-3 ${
          isUser
            ? 'rounded-br-sm bg-brand dark:bg-brand-dark'
            : 'rounded-bl-sm border border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
        }`}>
        <Text
          className={`text-[15px] leading-[22px] ${
            isUser ? 'text-white' : 'text-foreground dark:text-foreground-dark'
          }`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}
