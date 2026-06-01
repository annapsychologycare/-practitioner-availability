// Shared email HTML builder — used by SendClientModal and EmailTemplateTab preview.
import { EmailTemplateConfig, DEFAULT_EMAIL_TEMPLATE_CONFIG } from "../emailTemplateConfig";

export interface PractitionerEmailData {
  name: string;
  title: string;
  fees: string;
  medicare_rebate: string;
  availabilityLocations: Array<{ location: string; availability: string | string[] }>;
  link_to_bio: string;
  short_bio?: string;
  working_hours?: string;
  location_notes?: Record<string, string>;
}

export function parseAvailability(text: string | string[]): { weekly: string[]; fortnightly: string[] } {
  const weekly: string[] = [];
  const fortnightly: string[] = [];
  if (!text) return { weekly, fortnightly };
  const lines = Array.isArray(text)
    ? text.map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean)
    : text.split("\n").map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
  for (const line of lines) {
    if (/\(Monthly:/i.test(line)) continue;
    const cleaned = line
      .replace(/ at /i, " ")
      .replace(/\s*\((Weekly|Fortnightly): Starting ([^)]+)\)/i, " · from $2");
    if (/\(Weekly:/i.test(line)) weekly.push(cleaned);
    else if (/\(Fortnightly:/i.test(line)) fortnightly.push(cleaned);
  }
  return { weekly, fortnightly };
}

function renderSlotLine(slot: string, type: "weekly" | "fortnightly"): string {
  const dotIdx = slot.indexOf(" · from ");
  if (dotIdx > -1) {
    const dayTime = slot.substring(0, dotIdx).trim();
    const date = slot.substring(dotIdx + 8).trim();
    const formatted = /\sat\s/.test(dayTime)
      ? dayTime
      : dayTime.replace(/^(\S+)\s+/, "$1 at ");
    return `• ${formatted} (${type}) — from ${date}`;
  }
  return `• ${slot}`;
}

function buildAvailabilitySection(
  locations: Array<{ location: string; availability: string | string[] }>,
  config: EmailTemplateConfig,
  locationNotes?: Record<string, string>
): string {
  const c = config.colors;
  const activeLocs = locations.filter((l) => {
    const { weekly, fortnightly } = parseAvailability(l.availability || "");
    return weekly.length > 0 || fortnightly.length > 0;
  });
  if (activeLocs.length === 0) {
    return `<div style="padding:18px 22px 0;"><div style="font-size:11px;font-weight:700;color:${c.availability_heading};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Availability</div><div style="font-size:14px;color:#555;font-style:italic;line-height:1.6;">${config.no_availability_message}<br><span style="font-style:normal;color:#666;">${config.no_availability_subtext}</span></div></div>`;
  }
  let html = "";
  for (const loc of activeLocs) {
    const { weekly, fortnightly } = parseAvailability(loc.availability);
    const isMalvern = loc.location.toLowerCase().includes("malvern");
    const locLabel = isMalvern
      ? ` — Wattletree Rd, Malvern / Burke Rd, Camberwell (from 9 June 2026)`
      : ` — ${loc.location}`;
    const malvernNote = isMalvern
      ? `<div style="font-size:12px;color:${c.availability_heading};font-style:italic;margin-bottom:10px;line-height:1.6;">📍 We're excited to be moving to a larger, purpose-built clinic at Burke Road, Camberwell from 9 June 2026. Appointments from that date will be held at the new location.</div>`
      : "";
    const locNoteText = locationNotes?.[loc.location] || "";
    const locChangeNote = locNoteText
      ? `<div style="font-size:12px;color:#5a3060;background:#f5f0f9;border-left:3px solid ${c.availability_heading};border-radius:4px;padding:8px 12px;margin-bottom:10px;line-height:1.6;"><strong>Please Note:</strong> ${locNoteText.replace(/^Please Note:\s*/i, "")}</div>`
      : "";
    const slots = [
      ...weekly.map((s) => renderSlotLine(s, "weekly")),
      ...fortnightly.map((s) => renderSlotLine(s, "fortnightly")),
    ];
    html += `<div style="padding:18px 22px 0;"><div style="font-size:11px;font-weight:700;color:${c.availability_heading};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Availability${locLabel}</div>${malvernNote}${locChangeNote}<div style="font-size:14px;color:#333;line-height:2;">${slots.join("<br>")}</div></div>`;
  }
  return html;
}

function formatFeesInline(fees: string): string {
  return fees
    .replace(/B\/H:/g, "Business Hours:")
    .replace(/A\/H:/g, "After Hours:")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" &nbsp;&middot;&nbsp; ");
}

function formatMedicareInline(rebate: string): string {
  if (!rebate) return "";
  const lines = rebate.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const first = lines[0];
  const isAmount = /^[\$\d]/.test(first);
  if (isAmount) {
    const amt = first.startsWith("$") ? first : `$${first}`;
    const extras = lines.slice(1);
    let html = `${amt} per session`;
    if (extras.length)
      html += `<br><span style="font-size:12px;color:#777;font-style:italic;">${extras.join("<br>")}</span>`;
    html += `<br><span style="font-size:12px;color:#777;font-style:italic;">Valid with an eligible Mental Health Treatment Plan and GP referral.</span>`;
    return html;
  }
  return `<span style="font-size:13px;color:#777;font-style:italic;">${first}</span>`;
}

export function buildEmailHtml(
  clientName: string,
  note: string,
  senderName: string,
  practitioners: PractitionerEmailData[],
  config: EmailTemplateConfig = DEFAULT_EMAIL_TEMPLATE_CONFIG
): string {
  const c = config.colors;
  const sig = config.signature;

  let cards = "";
  for (const p of practitioners) {
    const availHtml = buildAvailabilitySection(p.availabilityLocations || [], config, p.location_notes);
    const feesInline = formatFeesInline(p.fees || "");
    const medicareInline = formatMedicareInline(p.medicare_rebate || "");
    const profileLink = p.link_to_bio
      ? `<div style="padding:12px 22px;background:#faf9fd;border-top:1px solid #ede9f5;text-align:right;"><a href="${p.link_to_bio}" style="font-size:13px;color:${c.title_color};font-weight:600;text-decoration:none;">View full profile →</a></div>`
      : "";
    cards += `
      <div style="border:1px solid ${c.card_border};border-radius:10px;margin-bottom:24px;overflow:hidden;">
        <div style="padding:20px 22px;border-bottom:1px solid #ede9f5;">
          <div style="font-size:17px;font-weight:700;color:${c.name_color};">${p.name}</div>
          <div style="font-size:13px;color:${c.title_color};margin-top:3px;">${p.title}</div>
          ${p.short_bio ? `<div style="font-size:13px;color:#666;font-style:italic;margin-top:10px;line-height:1.7;">${p.short_bio}</div>` : ""}
          ${p.working_hours ? `<div style="font-size:12px;color:${c.title_color};margin-top:8px;line-height:1.6;">🕐 ${p.working_hours}</div>` : ""}
        </div>
        ${availHtml}
        ${feesInline || medicareInline ? `
        <div style="padding:14px 22px 16px;font-size:13px;color:#444;line-height:1.9;border-top:1px solid #e8e4f0;">
          ${feesInline ? `<div><span style="font-weight:700;color:${c.name_color};">Fees:</span> ${feesInline}</div>` : ""}
          ${medicareInline ? `<div style="margin-top:4px;"><span style="font-weight:700;color:${c.name_color};">Medicare Rebate:</span> ${medicareInline}</div>` : ""}
        </div>` : ""}
        ${profileLink}
      </div>`;
  }

  const gk = config.good_to_know;
  const goodToKnow = `
    <div style="background:#ffffff;padding:24px 28px;border-top:1px solid #ede9f5;">
      <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Good to Know</div>
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:4px;">${gk.medicare.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.medicare.body}</div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:4px;">${gk.after_hours.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.after_hours.body}</div>
      </div>
      <div style="margin-bottom:0;">
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:4px;">${gk.private_health.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.private_health.body}</div>
      </div>
    </div>`;

  const closingHtml = config.closing_text.replace(/\n/g, "<br>");

  const signature = `
    <div style="border-top:1px solid #ede9f5;padding-top:16px;margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:6px;">${sig.practice_name}</div>
      <div style="font-size:12px;color:#666;line-height:1.9;">
        PH: ${sig.phone} &nbsp;&nbsp; Fax: ${sig.fax}<br>
        Email: <a href="mailto:${sig.email}" style="color:${c.title_color};text-decoration:none;">${sig.email}</a> &nbsp;&nbsp;
        Web: <a href="https://${sig.website}" style="color:${c.title_color};text-decoration:none;">${sig.website}</a><br>
        ${sig.addresses}<br>
        ${sig.footnote ? `<span style="font-size:11px;color:${c.title_color};font-style:italic;">${sig.footnote}</span>` : ""}
      </div>
    </div>`;

  const disclaimer = `
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #ede9f5;">
      <div style="font-size:11px;color:#999;line-height:1.7;">
        ${config.disclaimer.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>")}
      </div>
    </div>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;padding:28px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 12px rgba(44,36,76,0.10);">
        <div style="height:4px;background:linear-gradient(90deg,${c.header_bar_start} 0%,${c.header_bar_mid} 60%,${c.header_bar_end} 100%);"></div>
        <div style="padding:32px 28px;">
          <div style="font-size:16px;font-weight:600;color:${c.name_color};margin-bottom:10px;">Hi ${clientName},</div>
          <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 28px;">${config.intro_text}</p>
          ${note ? `<div style="background:#F0EEF7;border-left:3px solid ${c.title_color};padding:12px 16px;border-radius:4px;font-size:14px;font-style:italic;color:#555;margin-bottom:20px;">${note}</div>` : ""}
          ${cards}
        </div>
        ${goodToKnow}
        <div style="padding:28px 28px 24px;border-top:1px solid #ede9f5;background:#fff;">
          <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">${closingHtml}</p>
          <p style="font-size:14px;color:#555;margin:0 0 4px;">Warm regards,</p>
          <p style="font-size:14px;font-weight:700;color:${c.name_color};margin:0 0 20px;">${senderName}</p>
          ${signature}
          ${disclaimer}
        </div>
        <div style="background:${c.footer_bg};padding:14px 28px;text-align:center;">
          <div style="font-size:12px;color:${c.footer_text};">${sig.practice_name} &nbsp;·&nbsp; ${sig.email}</div>
        </div>
      </div>
    </div>`;
}
