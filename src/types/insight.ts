export type InsightType =
  | 'urgent_tasks'
  | 'upcoming_meeting'
  | 'reminder'
  | 'spending_alert'
  | 'due_today'
  | 'free_time'
  | 'positive';

export type InsightAction = 'agenda' | 'finances' | 'chat';

export type InsightTargetKind = 'task' | 'event';

export type InsightItem = {
  id: string;
  type: InsightType;
  title: string;
  subtitle?: string;
  action?: InsightAction;
  /** Opens this specific item instead of the full list. */
  targetId?: string;
  targetKind?: InsightTargetKind;
};
