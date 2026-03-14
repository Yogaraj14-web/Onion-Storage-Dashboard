import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if sensor is online based on timestamp
 * Returns true if the last update was within 120 seconds (2 minutes)
 */
export function isSensorOnline(timestamp: string | undefined | null): boolean {
  // If no timestamp, consider offline
  if (!timestamp) {
    return false;
  }

  try {
    const lastUpdate = new Date(timestamp).getTime();
    const now = Date.now();
    const differenceInSeconds = (now - lastUpdate) / 1000;
    return differenceInSeconds <= 120;
  } catch (error) {
    // If timestamp is invalid, consider offline
    return false;
  }
}
