export const WIDGET_NAME = 'KivoToday';
export const WIDGET_MAX_ITEMS = 5;
export const WIDGET_PAYLOAD_KEY = '@asistente/widget_payload_v1';
export const WIDGET_DEEP_LINK = 'kivo://agenda';
export const IOS_APP_GROUP = 'group.com.kivo.app.widget';
export const IOS_WIDGET_KIND = 'KivoTodayWidget';

export type WidgetTodayItemKind = 'task' | 'meeting' | 'reminder';

export type WidgetTodayItem = {
  id: string;
  title: string;
  time?: string;
  kind: WidgetTodayItemKind;
  priority?: 'high' | 'normal';
};

export type WidgetTodayPayload = {
  version: 1;
  updatedAt: string;
  dateLabel: string;
  headline: string;
  items: WidgetTodayItem[];
  overflowCount: number;
  emptyMessage?: string;
  enabled: boolean;
  deepLink: string;
};
