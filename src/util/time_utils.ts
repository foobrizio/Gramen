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
}

export function dayOfWeek(date: string): string {
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  return days[new Date(date).getDay()];
}

export function monthToString(month: string): string {
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    return months[parseInt(month) - 1];
}