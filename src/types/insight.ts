export type InsightType =
  | 'urgent_tasks'
  | 'upcoming_meeting'
  | 'reminder'
  | 'spending_alert'
  | 'due_today'
  | 'free_time'
  | 'positive';

export type InsightAction = 'agenda' | 'finances' | 'memory' | 'chat';

export type InsightItem = {
  id: string;
  type: InsightType;
  title: string;
  subtitle?: string;
  action?: InsightAction;
};
