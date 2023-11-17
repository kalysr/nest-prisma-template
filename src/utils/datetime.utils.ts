export function convertSecondsToDays(seconds: number): number {
  const secondsPerDay = 86400; // 24 hours * 60 minutes * 60 seconds

  return seconds / secondsPerDay;
}
