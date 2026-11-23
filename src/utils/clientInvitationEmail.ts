import type {EmailTemplateConfig} from '../emailTemplateConfig';

export const CLIENT_OPTIONS_PREVIEW_ANCHOR = '#staff-client-options-preview';
const escape = (value:string) => value.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
const lines = (value:string) => escape(value).replace(/\r?\n/g,'<br>');

// Staff-only email mock-up: no client link, token or private data in the URL.
// Copy/send remain unavailable for this format until secure links are implemented.
export function buildClientInvitationEmail(clientName:string,note:string,senderName:string,practitioners:Array<{name:string;title:string}>,config:EmailTemplateConfig,intro:string):string {
 const c=config.colors,s=config.signature;
 return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f0eef7;padding:28px 12px;">
 <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;">
 <div style="height:5px;background:linear-gradient(90deg,${c.header_bar_start},${c.header_bar_mid},${c.header_bar_end});"></div>
 <div style="padding:28px;color:#555;font-size:14px;line-height:1.8;">
 <p style="margin:0 0 18px;font-size:16px;color:${c.name_color};font-weight:bold;">Hi ${escape(clientName||'Client')},</p>
 <p>${lines(intro)}</p>
 ${note?`<div style="background:#f0eef7;border-left:4px solid ${c.title_color};padding:12px 16px;margin:18px 0;">${lines(note)}</div>`:''}
 <h2 style="font-size:20px;color:${c.name_color};margin:24px 0 10px;">Your practitioner options</h2>
 <p>We’ve put together the following options for you:</p>
 <ul style="padding-left:22px;">${practitioners.map(p=>`<li><strong>${escape(p.name)}</strong> — ${escape(p.title)}</li>`).join('')}</ul>
 <p>Use the button below to compare practitioner profiles, fees and appointment options. You can let us know your preferred practitioner and time, or ask our team a question.</p>
 <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td bgcolor="${c.title_color}" style="border-radius:7px;"><a data-client-options-preview="true" href="${CLIENT_OPTIONS_PREVIEW_ANCHOR}" style="display:inline-block;padding:15px 22px;color:#fff;font-size:15px;font-weight:bold;text-decoration:none;">View your practitioner options →</a></td></tr></table>
 <p style="font-size:13px;"><strong>Choosing a time is a request, not a confirmed booking.</strong> Our team will check availability and contact you to confirm. Appointment options may change.</p>
 <p style="font-size:13px;">You’re also welcome to reply to this email if you prefer.</p>
 <div style="background:#fff8e1;padding:12px 16px;font-size:12px;margin:20px 0;"><strong>STAFF TEST ONLY — DO NOT SEND.</strong> This button opens the selected-practitioner preview inside the test app. Private client links and message delivery are not connected.</div>
 <p>Warm regards,<br><strong style="color:${c.name_color};">${escape(senderName)}</strong></p>
 <div style="border-top:1px solid #ede9f5;padding-top:16px;font-size:12px;">
 <strong>${escape(s.practice_name)}</strong><br>PH: ${escape(s.phone)} &nbsp; Fax: ${escape(s.fax)}<br>
 Email: ${escape(s.email)} &nbsp; Web: ${escape(s.website)}<br>${lines(s.addresses)}
 ${s.footnote?`<br><em>${escape(s.footnote)}</em>`:''}</div>
 <p style="font-size:11px;color:#777;">${lines(config.disclaimer)}</p>
 </div></div></div>`;
}
