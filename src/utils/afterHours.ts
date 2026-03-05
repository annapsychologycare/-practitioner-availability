/**
 * Determines if a practitioner has after-hours availability.
 * After hours = any slot at 5pm or later on a weekday, OR any slot on Saturday/Sunday.
 */

const WEEKEND_DAYS = ['saturdays', 'sundays'];
const WEEKDAY_DAYS = ['mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays'];

/** Parse a time string like "9am", "5pm", "4:30pm", "11:30am" into minutes since midnight */
function parseTimeMinutes(timeStr: string): number | null {
  const normalized = timeStr.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(?::(\d+))?(am|pm)$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  if (ampm === 'pm' && hours !== 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Check a single slot string like "Mondays 5pm · from 17 Mar"
 * Returns true if this slot counts as after-hours.
 */
function slotIsAfterHours(slot: string): boolean {
  const parts = slot.trim().replace(/^\*\s*/, '').split(/\s+/);
  if (parts.length < 2) return false;
  const day = parts[0].toLowerCase();
  const timeStr = parts[1];

  if (WEEKEND_DAYS.includes(day)) return true;

  if (WEEKDAY_DAYS.includes(day)) {
    const mins = parseTimeMinutes(timeStr);
    if (mins !== null && mins >= 17 * 60) return true; // 5pm or later
  }

  return false;
}

/** Shape that both Practitioner (locations[].availability) and SendClientModal (availabilityGroups) use */
interface LocationGroup {
  weekly?: string[];
  fortnightly?: string[];
  availability?: string; // raw string format from practitioner locations
}

/**
 * Returns true if the practitioner has any after-hours slots.
 * Accepts either availabilityGroups (array of {weekly, fortnightly}) 
 * or locations (array of {availability: string}).
 */
export function hasAfterHoursAvailability(groups: LocationGroup[]): boolean {
  for (const group of groups) {
    // Structured format (weekly/fortnightly arrays)
    if (group.weekly) {
      for (const slot of group.weekly) {
        if (slotIsAfterHours(slot)) return true;
      }
    }
    if (group.fortnightly) {
      for (const slot of group.fortnightly) {
        if (slotIsAfterHours(slot)) return true;
      }
    }
    // Raw string format (e.g. "Mondays 5pm (Weekly: from 17 Mar)\nTuesdays 9am ...")
    if (group.availability) {
      const lines = group.availability.split('\n').filter(Boolean);
      for (const line of lines) {
        // Skip Monthly slots - we only track Weekly and Fortnightly
        if (/\(Monthly:/i.test(line)) continue;
        // Extract just the day+time part before any parenthesis
        const slotPart = line.split('(')[0].trim();
        if (slotIsAfterHours(slotPart)) return true;
      }
    }
  }
  return false;
}
