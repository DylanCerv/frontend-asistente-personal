export type ExternalCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  /** YYYY-MM-DD in local timezone */
  scheduledAt: string;
  /** Display start time e.g. "09:30" */
  time: string;
  /** Display end time e.g. "10:30" */
  endTime: string;
  durationMinutes: number;
  location?: string;
  description?: string;
  calendarName?: string;
  source: 'device';
};
