export const WIDGET_PAYLOAD_KEY = '@asistente/widget_payload_v2';
export const IOS_APP_GROUP = 'group.com.kivo.app.widget';

export const WIDGET_NAME_TODAY = 'KivoToday';
export const WIDGET_NAME_PRIORITY = 'KivoPriority';
export const WIDGET_NAME_CAPTURE = 'KivoCapture';
export const WIDGET_NAME_FOCUS_POINTS = 'KivoFocusPoints';

/** @deprecated Prefer WIDGET_NAME_TODAY */
export const WIDGET_NAME = WIDGET_NAME_TODAY;

export const ANDROID_WIDGET_NAMES = [
  WIDGET_NAME_TODAY,
  WIDGET_NAME_PRIORITY,
  WIDGET_NAME_CAPTURE,
] as const;

export type AndroidWidgetName = (typeof ANDROID_WIDGET_NAMES)[number];

export const IOS_WIDGET_KIND_TODAY = 'KivoTodayWidget';
export const IOS_WIDGET_KIND_PRIORITY = 'KivoPriorityWidget';
export const IOS_WIDGET_KIND_CAPTURE = 'KivoCaptureWidget';
export const IOS_WIDGET_KIND_FOCUS_POINTS = 'KivoFocusPointsWidget';

/** @deprecated Prefer IOS_WIDGET_KIND_TODAY */
export const IOS_WIDGET_KIND = IOS_WIDGET_KIND_TODAY;

export const IOS_WIDGET_KINDS = [
  IOS_WIDGET_KIND_TODAY,
  IOS_WIDGET_KIND_PRIORITY,
  IOS_WIDGET_KIND_CAPTURE,
] as const;

/** Visible rows in the agenda widget list (ListWidget scrolls when taller). */
export const WIDGET_MAX_ITEMS = 12;

export const WIDGET_DEEP_LINK_AGENDA = 'kivo://agenda';
export const WIDGET_DEEP_LINK_FOCUS = 'kivo://';
/** Opens Assistant and starts voice recording. */
export const WIDGET_DEEP_LINK_CAPTURE = 'kivo://assistant?autoRecord=1';
export const WIDGET_DEEP_LINK_REPORT = 'kivo://report';

/** @deprecated Prefer WIDGET_DEEP_LINK_AGENDA */
export const WIDGET_DEEP_LINK = WIDGET_DEEP_LINK_AGENDA;

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

export type WidgetPriorityItem = {
  id: string;
  title: string;
  dueLabel: string;
};

export type WidgetPriorityPayload = {
  label: string;
  title: string;
  dueLabel: string;
  /** Flexible / undated tasks — ListWidget scrolls when there are several. */
  items?: WidgetPriorityItem[];
  progressPercent: number;
  emptyMessage?: string;
  deepLink: string;
};

export type WidgetCapturePayload = {
  title: string;
  subtitle: string;
  deepLink: string;
};

export type WidgetFocusPointsPayload = {
  valueLabel: string;
  label: string;
  deltaLabel: string;
  deltaPositive: boolean;
  progressPercent: number;
  emptyMessage?: string;
  deepLink: string;
};

export type WidgetHomePayload = {
  version: 2;
  updatedAt: string;
  enabled: boolean;
  signedIn: boolean;
  today: WidgetTodayPayload;
  priority: WidgetPriorityPayload;
  capture: WidgetCapturePayload;
  focusPoints: WidgetFocusPointsPayload;
};
