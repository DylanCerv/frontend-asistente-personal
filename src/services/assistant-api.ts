import { apiConfig, isAssistantApiConfigured } from '@/config/api';
import type { AssistantChatRequest, AssistantChatResponse } from '@/types/api';

export class AssistantApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AssistantApiError';
  }
}

export async function sendMessageToAssistant(
  payload: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  if (!isAssistantApiConfigured()) {
    throw new AssistantApiError(
      'El endpoint de Kivo no está configurado. Agrega EXPO_PUBLIC_ASSISTANT_API_URL en tu archivo .env',
    );
  }

  const response = await fetch(apiConfig.assistantApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AssistantApiError(
      `Kivo respondió con error (${response.status}): ${errorBody || response.statusText}`,
      response.status,
    );
  }

  const data = (await response.json()) as AssistantChatResponse;

  if (!data.reply?.trim()) {
    throw new AssistantApiError('Kivo no devolvió una respuesta válida.');
  }

  return data;
}
