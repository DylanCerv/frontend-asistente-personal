import type { ChatMessage } from '@/types/assistant';

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createChatMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: createId(),
    role,
    content,
    timestamp: Date.now(),
  };
}
