import {APPROVED_LEAVE} from './crm_leave_approvals';
// Verified Contacts API names, 4 November 2026. Do not use HR leave reasons/status.
export const LEAVE_CRM_FIELDS = {
  upcoming_leave_client_notice: 'Upcoming_leave_client_notice',
  upcoming_leave_show_from: 'Show_notice_from',
  upcoming_leave_hide_after: 'Hide_notice_after',
} as const;
export function mapCrmUpcomingLeave(crm: Record<string, any>) {
  const out: Record<string,string> = {};
  for (const [app, source] of Object.entries(LEAVE_CRM_FIELDS)) {
    if (!Object.hasOwn(crm, source)) throw new Error(`CRM upcoming-leave field missing: ${source}`);
    if (crm[source] !== null && typeof crm[source] !== 'string') throw new Error(`Unexpected CRM upcoming-leave type: ${source}`);
    // Null/empty clears local values. Keep malformed dates for fail-closed rendering.
    out[app] = typeof crm[source] === 'string' ? crm[source].trim() : '';
  }
  if (!out.upcoming_leave_client_notice) return {upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''};
  // CRM text alone is NOT approval: Christmas sheet rows must explicitly be
  // Confirmed correct. Exact signatures prevent later unapproved edits/dates
  // from being published by ordinary weekly/daily sync. Never edit CRM here.
  const approved = APPROVED_LEAVE[String(crm.id ?? '')];
  if (!approved || approved.notice !== out.upcoming_leave_client_notice ||
      approved.show !== out.upcoming_leave_show_from ||
      approved.hide !== out.upcoming_leave_hide_after) {
    return {upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''};
  }
  return out;
}
