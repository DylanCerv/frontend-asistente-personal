export type Priority = 'low' | 'medium' | 'high';

export type TaskItem = {
  id: string;
  title: string;
  description?: string;
  dueLabel?: string;
  dueDate?: string;
  dueAtIso?: string;
  /** Missing when the user did not specify any day (open pending). */
  scheduledAt?: string;
  completedAt?: string;
  createdAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  priority: Priority;
  status: 'pending' | 'completed';
  category: string;
  tags: string[];
  assignedTo?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  scheduledAt: string;
  dueAtIso?: string;
  time: string;
  endTime?: string;
  durationMinutes?: number;
  type: 'meeting' | 'reminder' | 'event';
  status: 'pending' | 'completed';
  location?: string;
  description?: string;
  /** Origin of the event. Defaults to Kivo records when omitted. */
  source?: 'kivo' | 'device';
  readOnly?: boolean;
  calendarName?: string;
};

export type ReminderItem = {
  id: string;
  title: string;
  timeLabel?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type DaySummary = {
  meetings: number;
  tasks: number;
  importantPending: number;
};

export type DateRange = {
  start: string;
  end: string;
};

export type ReportPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';
