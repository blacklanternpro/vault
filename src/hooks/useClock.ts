import { useEffect, useState } from 'react';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

/** Ticking HH:MM:SS clock, re-rendered once a second. */
export function useClock(): string {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}
