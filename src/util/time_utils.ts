export function daysToMillis(days: number): number {
    return days * 24 * 60 * 60 * 1000;
}

export function hoursToMillis(hours: number): number {
    return hours * 60 * 60 * 1000;
}

export function minutesToMillis(minutes: number): number {
    return minutes * 60 * 1000;
}

export function secondsToMillis(seconds: number): number {
    return seconds * 1000;
}s