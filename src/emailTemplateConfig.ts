// Email template configuration — editable via the ✉️ Email Template tab.
// Changes are saved to localStorage so they persist without a rebuild.

export interface GoodToKnowBlock {
  heading: string;
  body: string;
}

export interface EmailTemplateConfig {
  senders: string[];
  intro_text: string;
  closing_text: string;
  good_to_know: {
    medicare: GoodToKnowBlock;
    after_hours: GoodToKnowBlock;
    private_health: GoodToKnowBlock;
  };
  no_availability_message: string;
  no_availability_subtext: string;
  signature: {
    practice_name: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
    addresses: string;
    footnote: string;
  };
  disclaimer: string;
  colors: {
    header_bar_start: string;
    header_bar_mid: string;
    header_bar_end: string;
    card_border: string;
    name_color: string;
    title_color: string;
    availability_heading: string;
    footer_bg: string;
    footer_text: string;
  };
}

export const DEFAULT_EMAIL_TEMPLATE_CONFIG: EmailTemplateConfig = {
  senders: ["Anna Donaldson", "Charlotte Davenport"],
  intro_text:
    "Thank you for reaching out to PsychologyCare. Based on your intake information, we've put together a list of practitioners we think could be a great fit for you.",
  closing_text:
    "At PsychologyCare, we place a strong emphasis on consistency and continuity of care. Once you secure a regular appointment time, that time is held just for you.\n\nFor example, if you book Mondays at 9:00AM, that becomes your dedicated therapy time each week or fortnight. We don't overbook or rotate clients through shared timeslots — your space is yours. We've found this consistency really supports therapeutic progress and creates a sense of stability.\n\nIf one of these practitioners resonates with you, simply let me know your preferred day and time and I'll secure it for you. If you'd like to talk through the options first, I'm very happy to do that as well.\n\nPlease don't hesitate to reach out with any questions at all — I'm here to help make this process feel as smooth as possible.",
  good_to_know: {
    medicare: {
      heading: "Medicare Rebates",
      body: "Medicare allows up to 10 sessions per calendar year under a Mental Health Treatment Plan. You pay the full fee upfront and the rebate is processed directly to your account. Ask your GP for a referral and MHTP if you don't already have one.",
    },
    after_hours: {
      heading: "After-Hours Appointments",
      body: "Please note that appointments booked for 5 PM (and later) and Weekend appointments are classified as after-hours appointments and attract a higher fee.",
    },
    private_health: {
      heading: "Private Health Insurance",
      body: "Please contact your insurer to confirm coverage for your specific practitioner type — our practice includes psychologists, counsellors, mental health social workers, and psychotherapists. Please also note that Medicare and private health insurance cannot be used together for the same appointment.",
    },
  },
  no_availability_message: "Currently fully booked — waitlist availability only.",
  no_availability_subtext: "We can add you to the waitlist for your preferred days and times.",
  signature: {
    practice_name: "PsychologyCare VIC",
    phone: "03 9088 1122",
    fax: "03 9972 2606",
    email: "info@psychologycare.com.au",
    website: "www.psychologycare.com.au",
    addresses:
      "673 Burke Road, CAMBERWELL 3124 | 183A Greville Street, PRAHRAN 3181 | 185A Greville Street, PRAHRAN 3181",
    footnote: "",
  },
  disclaimer:
    "DISCLAIMER: PsychologyCare is not a mental health crisis service and cannot provide urgent or immediate support. If immediate mental health assistance is required, please contact emergency services on 000 or Lifeline on 13 11 14.\n\nThis email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. This message contains confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by email if you have received this e-mail by mistake and delete this email from your system. If you are not the intended recipient you are notified that disclosing, copying, distributing or taking any action in reliance on the contents of this information is strictly prohibited.\n\nPlease note: There are inherent confidentiality risks in communicating by email. While safeguards are in place to ensure your privacy, you should not use email communication if you are concerned about any breaches of privacy that might inadvertently occur.",
  colors: {
    header_bar_start: "#2C244C",
    header_bar_mid: "#8D5273",
    header_bar_end: "#CDA8BA",
    card_border: "#c4bbd8",
    name_color: "#2C244C",
    title_color: "#8D5273",
    availability_heading: "#8D5273",
    footer_bg: "#2C244C",
    footer_text: "#CDA8BA",
  },
};

const STORAGE_KEY = "pc_email_template_config_v1";

function deepMerge(defaults: any, overrides: any): any {
  const result = { ...defaults };
  for (const key in overrides) {
    if (
      typeof overrides[key] === "object" &&
      !Array.isArray(overrides[key]) &&
      overrides[key] !== null &&
      typeof defaults[key] === "object" &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

export function loadEmailTemplateConfig(): EmailTemplateConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return deepMerge(DEFAULT_EMAIL_TEMPLATE_CONFIG, JSON.parse(stored)) as EmailTemplateConfig;
    }
  } catch (e) {}
  return { ...DEFAULT_EMAIL_TEMPLATE_CONFIG };
}

export function saveEmailTemplateConfig(config: EmailTemplateConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetEmailTemplateConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
