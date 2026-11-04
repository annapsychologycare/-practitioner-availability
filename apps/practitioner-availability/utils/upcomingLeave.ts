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
  if (!text) return '';
  // Escape first; retain source line breaks and distinct periods without parsing
  // or rewriting CRM wording. Tables/inline styles also work without email CSS.
  const paragraphs = text.split(/\r?\n/).map(line =>
    `<p style="margin:0;padding:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;mso-line-height-rule:at-least;color:#594653;">${escapeLeaveHtml(line) || '&nbsp;'}</p>`
  ).join('');
  return `<table data-upcoming-leave="client" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td style="padding:16px 24px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FBF7F4" style="width:100%;border-collapse:separate;background-color:#FBF7F4;border:1px solid #E9DDE3;border-left:3px solid #B58AA0;border-radius:8px;">
      <tr><td style="padding:16px 18px 10px;">
        <p style="margin:0;padding:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#8D5273;">Upcoming leave</p>
        ${paragraphs}
      </td></tr>
    </table>
  </td></tr></table>`;
}
