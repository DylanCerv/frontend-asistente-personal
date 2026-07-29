import { apiRequest } from '@/services/api/api-client';
import type { ApiDataResponse } from '@/types/api';

import type { ReminderAlertStyle } from '@/services/reminders/reminder-alert-style';
import type {
  ReminderAlertSoundId,
  ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';

export type AppLanguage = 'es' | 'en';
export type AppPlan = 'free' | 'pro';

export type UserSettings = {
  user_id: string;
  language: AppLanguage;
  push_notifications: boolean;
  reminder_notifications: boolean;
  reminder_alert_style: ReminderAlertStyle;
  reminder_alert_sound?: ReminderAlertSoundId;
  reminder_alert_vibration?: ReminderAlertVibrationId;
  auto_send_audio: boolean;
  /** biometric_lock is stored locally on device, not synced to backend */
  biometric_lock?: boolean;
  preferred_name: string;
  plan: AppPlan;
  created_at: string;
  updated_at: string;
};

export type UpdateSettingsPayload = Partial<
  Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at' | 'biometric_lock'>
>;

type SettingsResponse = ApiDataResponse<UserSettings>;

export async function getMySettings(): Promise<UserSettings> {
  const response = await apiRequest<SettingsResponse>('/settings/me');
  return response.data;
}

export async function updateMySettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  const response = await apiRequest<SettingsResponse>('/settings/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.data;
}
