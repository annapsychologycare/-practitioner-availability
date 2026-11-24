import type {EmailTemplateConfig} from '../emailTemplateConfig';

export const CLIENT_OPTIONS_PREVIEW_ANCHOR = '#staff-client-options-preview';
const escape = (value:string) => value.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
const lines = (value:string) => escape(value).replace(/\r?\n/g,'<br>');

// Staff-only email mock-up: no client link, token or private data in the URL.
// Copy/send remain unavailable for this format until secure links are implemented.
// The hosted original logo is a test asset; verify the production asset before rollout.
export function buildClientInvitationEmail(clientName:string,note:string,senderName:string,practitioners:Array<{name:string;title:string}>,config:EmailTemplateConfig,intro:string):string {
 const s=config.signature;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
 body{margin:0;padding:0;}a:focus-visible{outline:3px solid #9a82b6;outline-offset:4px;}
 @media(max-width:480px){.pc-email-outer{padding:12px 8px!important;}.pc-email-content{padding:24px 20px!important;}.pc-email-title{font-size:26px!important;}.pc-email-button{display:block!important;text-align:center!important;padding:15px 14px!important;}}
 </style></head><body style="margin:0;background:#f3f0f7;color:#36454f;font-family:Arial,Helvetica,sans-serif;">
 <div class="pc-email-outer" style="padding:24px 16px;">
 <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e6e0ed;border-radius:18px;overflow:hidden;">
 <div class="pc-email-content" style="padding:32px;">
 <img src="https://deploy-preview-3--pc-prac-availability.netlify.app/brand/psychologycare-email-logo.png" alt="PsychologyCare" width="180" style="display:block;width:180px;max-width:70%;height:auto;border:0;margin:0 0 28px;">
 <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Hi ${escape(clientName||'Client')},</p>
 <h1 class="pc-email-title" style="margin:0 0 18px;font-size:30px;line-height:1.2;letter-spacing:-.5px;color:#2b244c;font-weight:700;">Your practitioner options</h1>
 <p style="margin:0 0 20px;font-size:15px;line-height:1.8;">${lines(intro)}</p>
 ${note?`<div style="background:#f6f3fa;border-left:3px solid #b4a1c9;border-radius:0 10px 10px 0;padding:14px 18px;margin:0 0 22px;font-size:14px;line-height:1.8;">${lines(note)}</div>`:''}
 <div style="background:#f5f2f9;border:1px solid #e8e1f0;border-radius:14px;padding:22px;margin:0 0 26px;">
 <h2 style="margin:0 0 10px;color:#2b244c;font-size:18px;line-height:1.4;">Take a closer look</h2>
 <p style="margin:0 0 18px;font-size:14px;line-height:1.8;">Compare profiles, fees and appointment options in one place. Choose one or more practitioners, share the days and times that suit you, or ask us a question.</p>
 <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr><td><a class="pc-email-button" data-client-options-preview="true" href="${CLIENT_OPTIONS_PREVIEW_ANCHOR}" style="display:inline-block;background:#51416e;border:1px solid #51416e;border-radius:28px;padding:15px 22px;color:#fff;font-size:14px;line-height:1.5;font-weight:bold;text-decoration:none;">View your practitioner options &rarr;</a></td></tr></table>
 <p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#645970;">Take your time — you don’t need to decide straight away.</p>
 </div>
 <h2 style="margin:0 0 6px;font-size:17px;line-height:1.5;color:#2b244c;">${practitioners.length===1?'Your selected practitioner':'Your selected practitioners'}</h2>
 <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#69717b;">You’ll find more about ${practitioners.length===1?'this practitioner':'each practitioner'} on your options page.</p>
 <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">${practitioners.map(p=>`<tr><td style="padding:12px 0;border-bottom:1px solid #eee9f3;"><strong style="display:block;font-size:14px;line-height:1.6;color:#2b244c;">${escape(p.name)}</strong><span style="display:block;font-size:12px;line-height:1.7;color:#69717b;">${escape(p.title)}</span></td></tr>`).join('')}</table>
 <h2 style="margin:0 0 8px;font-size:17px;line-height:1.5;color:#2b244c;">We’ll help with the next step</h2>
 <p style="margin:0 0 12px;font-size:14px;line-height:1.8;">Once you share your preferences, our team will check current availability and contact you to confirm the details. <strong>Selecting a preference does not reserve or confirm an appointment.</strong></p>
 <p style="margin:0 0 24px;font-size:14px;line-height:1.8;">Not sure who to choose? We’re happy to help. You’re also welcome to reply to this email.</p>
 <p style="margin:0 0 24px;font-size:14px;line-height:1.8;">Warm regards,<br><strong style="color:#2b244c;">${escape(senderName)}</strong><br>The PsychologyCare team</p>
 <div style="border-top:1px solid #e8e1ee;padding-top:20px;font-size:12px;line-height:1.9;color:#69717b;">
 <strong style="color:#2b244c;font-size:14px;">${escape(s.practice_name)}</strong><br>Phone: ${escape(s.phone)}${s.fax?` &nbsp; | &nbsp; Fax: ${escape(s.fax)}`:''}<br>
 ${escape(s.email)}<br>${escape(s.website)}<br>${lines(s.addresses)}
 ${s.footnote?`<p style="margin:10px 0 0;">${escape(s.footnote)}</p>`:''}</div>
 ${config.disclaimer?`<p style="margin:18px 0 0;font-size:11px;line-height:1.7;color:#72727b;">${lines(config.disclaimer)}</p>`:''}
 </div></div>
 <div style="max-width:568px;margin:16px auto 0;padding:12px 16px;border:1px dashed #c8bdd7;border-radius:10px;color:#645970;font-size:11px;line-height:1.7;"><strong>STAFF TEST ONLY — DO NOT SEND.</strong> The button opens the selected-practitioner preview inside the test app. Private client links and message delivery are not connected.</div>
 </div></body></html>`;
}
