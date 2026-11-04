/** Canonical daily email. Email-only presentation; no app/profile mutations. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {invokeTool} from '@tasklet/tools/v2';
import {mainReview,phaseReview,esc,renderMainRows} from './availability_email_review';
const base='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
// Never prefer an old /tmp/import_result_clean.json over the successful current result.
const input=process.env.IMPORT_RESULT_PATH??'/tmp/import_result.json';
let result=JSON.parse(readFileSync(input,'utf8'));if(result.log)result=JSON.parse(result.log);
if(!result.ok)throw new Error('Import failed; refusing success email');
const raw=JSON.parse(readFileSync(process.env.RAW_EVIDENCE_PATH??`${base}/availability_raw_latest.json`,'utf8'));
if(raw.dateFrom!==result.dateRange.from||raw.dateTo!==result.dateRange.to)throw new Error('Occurrence evidence window mismatch');
const review=mainReview(result),phases=phaseReview(raw);
const box=(s:string)=>`<div style="background:#f7f3f5;border-left:4px solid #8D5273;padding:16px;margin:16px 0;">${s}</div>`;
const cell=(s:string)=>`<td style="padding:9px;border-bottom:1px solid #ddd;vertical-align:top;">${s}</td>`;
const rows=renderMainRows(review.rows);
const evidence=(c:any)=>`${esc(c.name)} — ${esc(c.location)}, ${esc(c.start)}, ${c.duration} minutes; ${esc(c.frequency)} → potential ${esc(c.potential)}.<br>Phase A: ${esc(c.phaseDates[0].join(', '))}.<br>Phase B: ${esc(c.phaseDates[1].join(', '))}.<br><strong>${esc(c.scope)}</strong>. Observed uninterrupted alignment ${esc(c.observedInterval.from)}–${esc(c.observedInterval.to)}. Missing full-window dates: ${esc(c.missingDates.join(', ')||'none')}; active non-pending dates: ${esc(c.blockedDates.join(', ')||'none')}. ${c.excludedInactiveRecords} inactive historical records excluded, not treated as bookings. Type proxy: ${esc(c.type)}; clinical type unverified.`;
const suggestions=(phases.candidates.length?phases.candidates.map(c=>box(evidence(c))).join(''):box('No complementary phase pairs passed the conservative checks. No recurrence changes suggested as confirmed capacity.'))+box(`${phases.candidates.filter(c=>c.frequency==='Monthly').length} Monthly → potential Fortnightly phase pairs found. Other single-phase patterns are nonmatches, not inferred free capacity.`);
const rejected=phases.rejected.map(c=>box(evidence(c)+`<br><strong>Not suggested:</strong> ${esc(c.reason)}<br>Missing dates: ${esc(c.missingDates.join(', ')||'none')}. Non-pending/inactive: ${esc(c.blockedDates.join(', ')||'none')}.`)).join('');
const conflicts=review.conflicts.map(c=>box(`${esc(c.name)} — ${esc(c.time)} (${esc(c.frequency)}): ${esc(c.reason)}<br>${c.representations.map((r:any)=>`${esc(r.location)} starting ${esc(r.start)}`).join('; ')}`)).join('');
const date=String(result.timestamp).replace(/^(\d{1,2} \w+ \d{4}).*$/,'$1');
const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;color:#333;"><div style="max-width:760px;margin:auto;background:white;padding:26px;"><h1 style="background:#2C244C;color:white;padding:22px;font-size:22px;">Availability Update — ${esc(date)}</h1><p>Source refreshed ${esc(result.timestamp)} Melbourne. This email supersedes the earlier summary format; app availability is unchanged.</p>${box(`<strong>${review.rows.length} deduplicated Weekly/Fortnightly patterns across ${review.practitioners} practitioners</strong><br>${review.counts.Weekly} Weekly · ${review.counts.Fortnightly} Fortnightly<br>Window ${esc(raw.dateFrom.slice(0,10))}–${esc(raw.dateTo.slice(0,10))} inclusive. One row and count per practitioner/day/start/frequency; alternative locations/first dates share a row, not extra capacity. Patterns are not appointment occurrences or guaranteed independent capacity. Excluded source frequency is absent from this main list and all main counts; considered only in the separate review below. Josh is represented Telehealth-only here; clinic-only conflicts are separate, not silently converted.<br>${result.totalAppointmentsFetched} source appointments fetched; ${(result.unmatched??[]).length} unmatched practitioners.`)}<h2 style="color:#2C244C;font-size:18px;">Weekly / Fortnightly availability</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2C244C;color:white;">${cell('Practitioner')}${cell('Location / source first date')}${cell('Slot')}</tr></thead><tbody>${rows}</tbody></table><h2 style="color:#2C244C;font-size:18px;">Josh location review — not additional main-list capacity</h2>${conflicts||'<p>No conflicts.</p>'}<h2 style="color:#2C244C;font-size:18px;">Suggested consolidations — Anna review only</h2>${box(esc(phases.caveat))}${suggestions}<h3 style="color:#2C244C;">Near-matches rejected / partial-window evidence</h3>${rejected||'<p>No complementary-phase near-matches in the extract.</p>'}<p style="font-size:12px;color:#666;">No Zanda, recurrence, app data, timestamp, CRM, private infrastructure, ages/login or leave-notice changes made by this email review.</p></div></body></html>`;
const suffix=process.env.EMAIL_ARTIFACT_SUFFIX??'latest';
writeFileSync(`${base}/availability_email_${suffix}.html`,html);
writeFileSync('/tmp/availability_email.html',html);
writeFileSync(`${base}/availability_email_review_${suffix}.json`,JSON.stringify({sourceTimestamp:result.timestamp,main:review,phases},null,2));
console.log(JSON.stringify({rows:review.rows.length,practitioners:review.practitioners,counts:review.counts,candidates:phases.candidates.length,rejected:phases.rejected.length,conflicts:review.conflicts.length}));
if(process.argv.includes('--preview'))process.exit(0);
// Content-addressed send ledger prevents accidental re-sends of an identical email.
const hash=new Bun.CryptoHasher('sha256').update(html).digest('hex');
const receiptPath=`${base}/email_send_ledger_${hash}.json`;
if(existsSync(receiptPath))throw new Error('Identical summary already sent; receipt '+receiptPath);
const r=await invokeTool({toolName:'gmail_send_message',connectionId:'conn_nrjy2ygpjb7gn16jk3et',args:{to:['anna@psychologycare.com.au'],subject:`Availability Update — ${date} (${review.rows.length} Weekly/Fortnightly patterns across ${review.practitioners} practitioners)`,bodyHtml:html}});
if(!r.ok)throw new Error(r.error);
const receipt=await r.json();writeFileSync(receiptPath,JSON.stringify(receipt,null,2));writeFileSync(`${base}/email_receipt_${suffix}.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
