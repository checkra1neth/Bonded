const MS_IN_DAY = 86_400_000;

export function resolveStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function isWithinWindow(reference: number, windowStart: number): boolean {
  return reference >= windowStart && reference < windowStart + MS_IN_DAY;
}
