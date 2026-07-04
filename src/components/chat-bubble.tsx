import { Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { APP_NAME } from '@/constants/branding';
import type { ChatMessage } from '@/types/assistant';

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View className="max-w-[84%] self-end">
        <View className="rounded-[22px] rounded-br-md bg-brand px-4 py-3 shadow-sm dark:bg-brand-dark">
          <Text className="text-[15px] leading-[22px] text-white">{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="max-w-[88%] flex-row items-end gap-2 self-start">
      <View className="mb-0.5">
        <KivoLogo size={22} />
      </View>
      <View className="gap-1">
        <Text className="px-1 text-[11px] font-semibold text-subtle dark:text-subtle-dark">
          {APP_NAME}
        </Text>
        <View className="rounded-[22px] rounded-bl-md border border-border bg-white px-4 py-3 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <Text className="text-[15px] leading-[22px] text-foreground dark:text-foreground-dark">
            {message.content}
          </Text>
        </View>
      </View>
    </View>
  );
}
