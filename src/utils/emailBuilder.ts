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
  photo_url?: string;
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
    return `
      <div style="padding:16px 24px;">
        <div style="font-size:11px;font-weight:700;color:${c.availability_heading};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Availability</div>
        <div style="font-size:13px;color:#8D5273;font-style:italic;line-height:1.7;background:#fdf8fb;border-radius:6px;padding:10px 14px;">${config.no_availability_message}</div>
      </div>`;
  }
  let html = "";
  for (const loc of activeLocs) {
    const { weekly, fortnightly } = parseAvailability(loc.availability);
    const isMalvern = loc.location.toLowerCase().includes("malvern");
    const locLabel = isMalvern
      ? ` — Wattletree Rd, Malvern / Burke Rd, Camberwell (from 9 June 2026)`
      : ` — ${loc.location}`;
    const malvernNote = isMalvern
      ? `<div style="font-size:12px;color:${c.availability_heading};font-style:italic;margin-bottom:8px;line-height:1.6;">📍 Moving to a larger, purpose-built clinic at Burke Road, Camberwell from 9 June 2026.</div>`
      : "";
    const locNoteText = locationNotes?.[loc.location] || "";
    const locChangeNote = locNoteText
      ? `<div style="font-size:12px;color:#5a3060;background:#f5f0f9;border-left:3px solid ${c.availability_heading};border-radius:4px;padding:8px 12px;margin-bottom:10px;line-height:1.6;"><strong>Please Note:</strong> ${locNoteText.replace(/^Please Note:\s*/i, "")}</div>`
      : "";
    const weeklySlots = weekly.map((s) => renderSlotLine(s, "weekly"));
    const fortnightlySlots = fortnightly.map((s) => renderSlotLine(s, "fortnightly"));
    const allSlots = [...weeklySlots, ...fortnightlySlots];
    html += `
      <div style="padding:16px 24px 0;">
        <div style="font-size:11px;font-weight:700;color:${c.availability_heading};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Availability${locLabel}</div>
        ${malvernNote}${locChangeNote}
        <div style="background:#f8f6fc;border-radius:8px;padding:12px 14px;">
          <div style="font-size:13px;color:#333;line-height:2.0;">${allSlots.join("<br>")}</div>
        </div>
      </div>`;
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
      html += `<br><span style="font-size:12px;color:#888;font-style:italic;">${extras.join("<br>")}</span>`;
    html += `<br><span style="font-size:12px;color:#888;font-style:italic;">Valid with an eligible Mental Health Treatment Plan and GP referral.</span>`;
    return html;
  }
  return `<span style="font-size:13px;color:#888;font-style:italic;">${first}</span>`;
}

function buildPractitionerCard(p: PractitionerEmailData, config: EmailTemplateConfig): string {
  const c = config.colors;
  const availHtml = buildAvailabilitySection(p.availabilityLocations || [], config, p.location_notes);
  const feesInline = formatFeesInline(p.fees || "");
  const medicareInline = formatMedicareInline(p.medicare_rebate || "");

  // Photo circle in header — use embedded base64 (avoids Gmail image blocking)
  const photoSrc = (p as any).photo_b64 || p.photo_url || null;
  const photoHtml = photoSrc
    ? `<td width="84" valign="middle" style="padding-right:16px;">
        <img src="${photoSrc}" width="80" height="80"
          style="border-radius:50%;border:3px solid rgba(255,255,255,0.35);display:block;object-fit:cover;width:80px;height:80px;" />
      </td>`
    : `<td width="84" valign="middle" style="padding-right:16px;">
        <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:rgba(255,255,255,0.7);font-weight:700;">${p.name.charAt(0)}</span>
        </div>
      </td>`;

  const profileLink = p.link_to_bio
    ? `<div style="padding:12px 24px 16px;border-top:1px solid #ede9f5;background:#faf9fd;text-align:right;">
        <a href="${p.link_to_bio}" style="font-size:13px;color:${c.title_color};font-weight:600;text-decoration:none;letter-spacing:0.01em;">View full profile →</a>
      </div>`
    : "";

  return `
    <div style="border:1px solid ${c.card_border};border-radius:12px;margin-bottom:24px;overflow:hidden;box-shadow:0 3px 14px rgba(44,36,76,0.10);">

      <!-- Card header: gradient with photo -->
      <div style="background:linear-gradient(135deg,#2C244C 0%,#8D5273 100%);padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            ${photoHtml}
            <td valign="middle">
              <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.2;margin-bottom:4px;">${p.name}</div>
              <div style="font-size:13px;color:#e8d4e4;line-height:1.5;">${p.title}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Bio + working hours -->
      ${p.short_bio || p.working_hours ? `
      <div style="padding:16px 24px;border-bottom:1px solid #ede9f5;">
        ${p.short_bio ? `<div style="font-size:13px;color:#555;font-style:italic;line-height:1.8;margin-bottom:${p.working_hours ? "8px" : "0"};">${p.short_bio}</div>` : ""}
        ${p.working_hours ? `<div style="font-size:12px;color:${c.title_color};line-height:1.6;">🕐 ${p.working_hours}</div>` : ""}
      </div>` : ""}

      <!-- Availability -->
      ${availHtml}

      <!-- Fees -->
      ${feesInline || medicareInline ? `
      <div style="padding:14px 24px 16px;font-size:13px;color:#444;line-height:2.0;border-top:1px solid #ede9f5;margin-top:16px;">
        ${feesInline ? `<div><span style="font-weight:700;color:${c.name_color};">Fees:</span> ${feesInline}</div>` : ""}
        ${medicareInline ? `<div style="margin-top:2px;"><span style="font-weight:700;color:${c.name_color};">Medicare Rebate:</span> ${medicareInline}</div>` : ""}
      </div>` : ""}

      ${profileLink}
    </div>`;
}

export function buildEmailHtml(
  clientName: string,
  note: string,
  senderName: string,
  practitioners: PractitionerEmailData[],
  config: EmailTemplateConfig = DEFAULT_EMAIL_TEMPLATE_CONFIG,
  compareUrl?: string
): string {
  const c = config.colors;
  const sig = config.signature;

  const cards = practitioners.map((p) => buildPractitionerCard(p, config)).join("");

  const gk = config.good_to_know;
  const goodToKnow = `
    <div style="background:#faf9fd;padding:24px 28px;border-top:2px solid #ede9f5;">
      <div style="font-size:12px;font-weight:700;color:${c.name_color};margin-bottom:16px;text-transform:uppercase;letter-spacing:0.08em;">Good to Know</div>
      <div style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:3px;">${gk.medicare.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.medicare.body}</div>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:3px;">${gk.after_hours.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.after_hours.body}</div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:3px;">${gk.private_health.heading}</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">${gk.private_health.body}</div>
      </div>
    </div>`;

  const closingHtml = config.closing_text.replace(/\n/g, "<br>");

  const signature = `
    <div style="border-top:1px solid #ede9f5;padding-top:16px;margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:${c.name_color};margin-bottom:6px;">${sig.practice_name}</div>
      <div style="font-size:12px;color:#666;line-height:2.0;">
        PH: ${sig.phone} &nbsp;&nbsp; Fax: ${sig.fax}<br>
        Email: <a href="mailto:${sig.email}" style="color:${c.title_color};text-decoration:none;">${sig.email}</a> &nbsp;&nbsp;
        Web: <a href="https://${sig.website}" style="color:${c.title_color};text-decoration:none;">${sig.website}</a><br>
        ${sig.addresses}<br>
        ${sig.footnote ? `<span style="font-size:11px;color:${c.title_color};font-style:italic;">${sig.footnote}</span>` : ""}
      </div>
    </div>`;

  const disclaimer = `
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #ede9f5;">
      <div style="font-size:11px;color:#aaa;line-height:1.7;">
        ${config.disclaimer.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>")}
      </div>
    </div>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f0eef7;padding:28px 12px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(44,36,76,0.13);">

        <!-- Top accent bar -->
        <div style="height:5px;background:linear-gradient(90deg,${c.header_bar_start} 0%,${c.header_bar_mid} 60%,${c.header_bar_end} 100%);"></div>

        <!-- Intro -->
        <div style="padding:32px 28px 24px;">
          <div style="font-size:16px;font-weight:700;color:${c.name_color};margin-bottom:10px;">Hi ${clientName},</div>
          <p style="font-size:14px;line-height:1.85;color:#555;margin:0 0 24px;">${config.intro_text}</p>
          ${note ? `<div style="background:#F0EEF7;border-left:4px solid ${c.title_color};padding:12px 16px;border-radius:6px;font-size:14px;font-style:italic;color:#555;margin-bottom:24px;">${note}</div>` : ""}
          ${cards}
          ${compareUrl && practitioners.length >= 2
            ? `<div style="text-align:center;margin:4px 0 28px;">
                <a href="${compareUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#2C244C 0%,#8D5273 100%);color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 3px 12px rgba(44,36,76,0.22);letter-spacing:0.01em;">
                  🔍 Compare these practitioners side by side →
                </a>
                <div style="font-size:11px;color:#aaa;margin-top:8px;">Opens a comparison page in your browser</div>
              </div>`
            : ""}
        </div>

        <!-- Good to Know -->
        ${goodToKnow}

        <!-- Closing + Signature -->
        <div style="padding:28px 28px 24px;background:#fff;border-top:1px solid #ede9f5;">
          <p style="font-size:14px;line-height:1.85;color:#555;margin:0 0 24px;">${closingHtml}</p>
          <p style="font-size:14px;color:#555;margin:0 0 4px;">Warm regards,</p>
          <p style="font-size:14px;font-weight:700;color:${c.name_color};margin:0 0 20px;">${senderName}</p>
          ${signature}
          ${disclaimer}
        </div>

        <!-- Footer -->
        <div style="background:${c.footer_bg};padding:14px 28px;text-align:center;border-top:1px solid #ede9f5;">
          <div style="font-size:12px;color:${c.footer_text};">${sig.practice_name} &nbsp;·&nbsp; ${sig.email}</div>
        </div>
      </div>
    </div>`;
}
