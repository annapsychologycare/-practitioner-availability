// Only these approved client fields may enter staff/client upcoming-leave sections.
export interface UpcomingLeaveFields {
  upcoming_leave_client_notice?: string;
  upcoming_leave_show_from?: string;
  upcoming_leave_hide_after?: string;
}

export function melbourneDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-AU', {timeZone:'Australia/Melbourne', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}

export function activeUpcomingLeave(p: UpcomingLeaveFields, now = new Date()): string {
  const text = typeof p.upcoming_leave_client_notice === 'string' ? p.upcoming_leave_client_notice.trim() : '';
  if (!text) return '';
  const from = p.upcoming_leave_show_from ?? '', until = p.upcoming_leave_hide_after ?? '';
  if (typeof from !== 'string' || typeof until !== 'string') return '';
  if ((from && !validDate(from)) || (until && !validDate(until)) || (from && until && from > until)) return '';
  const today = melbourneDate(now);
  return (from && today < from) || (until && today > until) ? '' : text;
}

export function escapeLeaveHtml(text: string): string {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function upcomingLeaveEmailHtml(p: UpcomingLeaveFields, now = new Date()): string {
  const text = activeUpcomingLeave(p, now);
  return text ? `<div data-upcoming-leave="client" style="padding:12px 24px;white-space:pre-line;"><strong>Upcoming leave</strong><div>${escapeLeaveHtml(text)}</div></div>` : '';
}
