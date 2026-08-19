export function getDeviceTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && timeZone.length <= 64) return timeZone;
  } catch {
    // Fall through to UTC if the runtime has no IANA data.
  }
  return 'UTC';
}

export function getDeviceUtcOffset(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getDeviceTimeZone(),
    timeZoneName: 'shortOffset',
    hour: 'numeric',
  }).formatToParts(date);
  const name = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  if (name === 'GMT' || name === 'UTC') return 'GMT';
  return name.replace('GMT', 'GMT');
}

export function formatDeviceClock(date = new Date()): string {
  return date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: getDeviceTimeZone(),
  });
}

export function formatDeviceTimeZoneLabel(date = new Date()): string {
  const timeZone = getDeviceTimeZone();
  const offset = getDeviceUtcOffset(date);
  const city = timeZone.includes('/') ? timeZone.split('/').pop()?.replace(/_/g, ' ') : timeZone;
  return `${formatDeviceClock(date)} · ${city} (${offset})`;
}
