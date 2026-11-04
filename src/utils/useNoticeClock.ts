import {useEffect, useState} from 'react';
import {melbourneDate} from './upcomingLeave';
// Re-evaluate open staff views/previews across Melbourne midnight and tab resume.
export function useNoticeClock(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    // Keep the state stable during the same Melbourne day: do not reload email
    // iframes every second. Render once when the calendar day changes.
    const update = () => setNow(previous => {
      const current = Date.now();
      return melbourneDate(new Date(previous)) === melbourneDate(new Date(current)) ? previous : current;
    });
    const timer = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  return now;
}
