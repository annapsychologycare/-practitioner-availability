/**
 * Static Daily Roster — PsychologyCare
 *
 * Posts the base weekly roster to each location's Slack channel at 7am Melbourne time.
 * Practitioners reply to the message if they're not coming in or leaving early.
 *
 * Run: bun -i roster_static.ts [YYYY-MM-DD]
 */

import { invokeTool } from '@tasklet/tools/v2';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('/tasklet/agent/home/slack_roster_config.json', 'utf8'));

// ── Types ───────────────────────────────────────────────────────────────────

type Entry = {
  name: string;
  slackId?: string;
  hours: string;
  room: string;
  alternate?: boolean; // true = only every second Saturday
};

type DayRoster = Record<string, Entry[]>;

// ── Slack User IDs ──────────────────────────────────────────────────────────

const SLACK_IDS: Record<string, string> = {
  'Niloo':     'U07MLL4HF6G',
  'Amy':       'U07MJ2NSNGK',
  'Krista':    'U07MWRHFF4H',
  'Rebekah':   'U07MJ5N81MG',
  'Bek':       'U07MJ5N81MG',
  'Alex':      'U07MBGKHJVC',
  'David':     'U07JE6TNM6K',
  'Maddie':    'U09V65YKG01',
  'Ricki':     'U07N6UY4B7S',
  'Karen':     'U08T872NM9R',
  'Clare':     'U08P0CCB3QF',
  'Poorna':    'U07MJ5P46SW',
  'Christine': 'U07MLL4JPRS',
  'Meg':       'U07MWRGP4KT',
  'Ruby':      'U07MJ2PPV K5'.replace(' ', ''), // U07MJ2PPVK5
  'Brigid':    'U07MJ5N5K18',
  'Nick B':    'U07JX82VAJ0',
  'Pete':      'U07MWRHLK6D',
  'Cristina':  'U07N6UY9J9W',
  'Nick K':    'U07MJ2PNEQK',
  'Josh':      'U0B5GNNNH24',
  'Elizabeth': 'U07MLL3NQS0',
  'Allison':   'U07N6UWPCAU',
  'Belinda':   'U07MJ5MT40J',
};

// ── Static Roster ───────────────────────────────────────────────────────────

const ROSTER: Record<string, DayRoster> = {
  Monday: {
    camberwell: [
      { name: 'Niloo',    hours: '8am–2:30pm',   room: 'Schwartz Room' },
      { name: 'Amy',      hours: '8am–2pm',       room: 'Coughlin Room' },
      { name: 'Krista',   hours: '8am–2pm',       room: 'Heritage Room' },
      { name: 'Rebekah',  hours: '10am–5pm',      room: 'Frederickson Room' },
      { name: 'Alex',     hours: '2:30pm–8:30pm', room: 'Coughlin Room' },
    ],
    '183a': [
      { name: 'David',    hours: '9am–5pm',       room: 'Grey Room' },
      { name: 'Maddie',   hours: '8am–2pm',       room: 'Brown Room' },
      { name: 'Ricki',    hours: '2:30pm–8:30pm', room: 'Brown Room' },
      { name: 'Karen',    hours: '8am–2pm',       room: 'Green Room' },
      { name: 'Clare',    hours: '2:30pm–8:30pm', room: 'Green Room' },
    ],
    '185a': [
      { name: 'Poorna',   hours: '9am–4pm',       room: 'Toucan Room' },
      { name: 'Christine',hours: '8am–5pm',       room: 'Abstract Room' },
    ],
  },

  Tuesday: {
    camberwell: [
      { name: 'Niloo',    hours: '2:30pm–8pm',    room: 'Schwartz Room' },
      { name: 'Meg',      hours: '8am–2pm',       room: 'Coughlin Room' },
      { name: 'Alex',     hours: '2:30pm–8:30pm', room: 'Coughlin Room' },
      { name: 'Ruby',     hours: '8am–2pm',       room: 'Heritage Room' },
      { name: 'Brigid',   hours: '2:30pm–8:30pm', room: 'Heritage Room' },
      { name: 'Nick B',   hours: '8am–3:30pm',    room: 'Frederickson Room' },
    ],
    '183a': [
      { name: 'Poorna',   hours: '8:30am–3:30pm', room: 'Grey Room' },
      { name: 'Pete',     hours: '8am–3pm',       room: 'Brown Room' },
      { name: 'Karen',    hours: '2:30pm–8:30pm', room: 'Green Room' },
    ],
    '185a': [
      { name: 'Nick K',   hours: '9am–5pm',       room: 'Toucan Room' },
      { name: 'Christine',hours: '8am–2pm',       room: 'Abstract Room' },
      { name: 'Clare',    hours: '2:30pm–8:30pm', room: 'Abstract Room' },
    ],
  },

  Wednesday: {
    camberwell: [
      { name: 'Nick K',   hours: '8am–2pm',       room: 'Schwartz Room' },
      { name: 'Meg',      hours: '8am–2pm',       room: 'Coughlin Room' },
      { name: 'Josh',     hours: '2:30pm–8:30pm', room: 'Coughlin Room' },
      { name: 'Ruby',     hours: '8am–2pm',       room: 'Heritage Room' },
      { name: 'David',    hours: '2:30pm–5:30pm', room: 'Heritage Room' },
      { name: 'Nick B',   hours: '8am–2pm',       room: 'Frederickson Room' },
    ],
    '183a': [
      { name: 'Brigid',   hours: '8am–2pm',       room: 'Grey Room' },
      { name: 'Poorna',   hours: '2:30pm–8:30pm', room: 'Grey Room' },
      { name: 'Pete',     hours: '8am–3pm',       room: 'Brown Room' },
      { name: 'Karen',    hours: '1pm–6:30pm',    room: 'Green Room' },
    ],
    '185a': [
      { name: 'David',    hours: '9am–12pm',      room: 'Toucan Room' },
      { name: 'Alex',     hours: '2:30pm–8:30pm', room: 'Toucan Room' },
      { name: 'Elizabeth',hours: '8am–2pm',       room: 'Abstract Room' },
      { name: 'Christine',hours: '2:30pm–8:30pm', room: 'Abstract Room' },
    ],
  },

  Thursday: {
    camberwell: [
      { name: 'Niloo',    hours: '8am–2pm',       room: 'Schwartz Room' },
      { name: 'Meg',      hours: '8am–2pm',       room: 'Coughlin Room' },
      { name: 'Josh',     hours: '2:30pm–8:30pm', room: 'Coughlin Room' },
      { name: 'Nick K',   hours: '9am–2pm',       room: 'Heritage Room' },
      { name: 'Nick B',   hours: '8am–2pm',       room: 'Frederickson Room' },
    ],
    '183a': [
      { name: 'David',    hours: '8am–12pm',      room: 'Grey Room' },
      { name: 'Allison',  hours: '12pm–2pm',      room: 'Grey Room' },
      { name: 'David',    hours: '2:30pm–8:30pm', room: 'Grey Room' },
      { name: 'Belinda',  hours: '8am–2pm',       room: 'Brown Room' },
      { name: 'Karen',    hours: '8am–2pm',       room: 'Green Room' },
    ],
    '185a': [
      { name: 'Maddie',   hours: '8am–2pm',       room: 'Toucan Room' },
      { name: 'Alex',     hours: '2:30pm–8:30pm', room: 'Toucan Room' },
      { name: 'Elizabeth',hours: '8am–2pm',       room: 'Abstract Room' },
      { name: 'Brigid',   hours: '2:30pm–8:30pm', room: 'Abstract Room' },
    ],
  },

  Friday: {
    camberwell: [
      { name: 'Amy',      hours: '8am–3pm',       room: 'Schwartz Room' },
      { name: 'Alex',     hours: '8am–2pm',       room: 'Coughlin Room' },
      { name: 'Nick K',   hours: '8am–3pm',       room: 'Heritage Room' },
    ],
    '185a': [
      { name: 'Maddie',   hours: '8am–2pm',       room: 'Toucan Room' },
      { name: 'Christine',hours: '2:30pm–8:30pm', room: 'Toucan Room' },
      { name: 'Elizabeth',hours: '8am–2pm',       room: 'Abstract Room' },
    ],
  },

  Saturday: {
    camberwell: [
      { name: 'Ricki',    hours: '9:30am–12:30pm',room: 'Schwartz Room', alternate: true },
      { name: 'Bek',      hours: '9am–2pm',       room: 'Frederickson Room' },
    ],
    '185a': [
      { name: 'Christine',hours: '8am–5pm',       room: 'Toucan Room' },
    ],
  },
};

// ── Location display names ──────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  camberwell: 'Burke Rd, Camberwell',
  '183a':     '183A Greville St, Prahran',
  '185a':     '185A Greville St, Prahran',
};

// ── Ricki alternating Saturday ──────────────────────────────────────────────
// Aug 8 2026 = off. She works every other Saturday.

function isRickiWorkingSaturday(date: Date): boolean {
  const offRef = new Date('2026-08-08T00:00:00+10:00');
  const diffDays = (date.getTime() - offRef.getTime()) / (1000 * 60 * 60 * 24);
  const weekOffset = Math.round(diffDays / 7);
  return weekOffset % 2 !== 0;
}

// ── Date helpers ────────────────────────────────────────────────────────────

function getMelbourneDate(isoDate?: string): Date {
  let year: number, month: number, day: number;
  if (isoDate) {
    [year, month, day] = isoDate.split('-').map(Number);
  } else {
    const melbStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' });
    [year, month, day] = melbStr.split('-').map(Number);
  }
  return new Date(year, month - 1, day);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDateLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()];
  const d = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${day} ${d} ${month}`;
}

function pad(n: number): string { return String(n).padStart(2, '0'); }
function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ── Message builder ─────────────────────────────────────────────────────────

function buildMessage(dateLabel: string, locationLabel: string, entries: Entry[]): string {
  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  const header = `:calendar:  *${dateLabel} — ${locationLabel}*`;

  const notice =
    `${divider}\n` +
    `:information_source:  *This is the default roster* and does not take into account leave or early departures.\n\n` +
    `*Please let everyone know* as soon as possible if you are *not coming in* or *leaving early* — ` +
    `correct lockup depends on it. When in doubt, it's best to lock up! :lock:\n\n` +
    `*Remember to leave your room door open when you leave.* :door:`;

  const rows = entries.map(e => {
    const slackId = SLACK_IDS[e.name];
    const nameTag = slackId ? `<@${slackId}>` : `*${e.name}*`;
    return `${nameTag}   ${e.hours}   |   ${e.room}`;
  }).join('\n');

  const footer =
    `${divider}\n` +
    `_Reply to this message if your plans change_ :pray:`;

  return [header, notice, rows, footer].join('\n\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const argDate = process.argv[2];
  const date = getMelbourneDate(argDate);
  const dayName = DAY_NAMES[date.getDay()];
  const dateLabel = formatDateLabel(date);
  const testMode: boolean = config.test_mode;

  if (dayName === 'Sunday') {
    console.log(JSON.stringify({ ok: true, skipped: 'Sunday — no roster posted' }));
    return;
  }

  const dayRoster = ROSTER[dayName];
  if (!dayRoster) {
    console.log(JSON.stringify({ ok: true, skipped: `No roster configured for ${dayName}` }));
    return;
  }

  const results: Array<{ location: string; ok: boolean; error?: string }> = [];

  for (const [locationKey, entries] of Object.entries(dayRoster)) {
    // Filter entries
    const filtered = entries.filter(e => {
      if (e.alternate && dayName === 'Saturday') {
        return isRickiWorkingSaturday(date);
      }
      return true;
    });

    if (filtered.length === 0) continue;

    const locationLabel = LOCATION_LABELS[locationKey] ?? locationKey;
    const message = buildMessage(dateLabel, locationLabel, filtered);

    const channelId = testMode
      ? config.test_channel_id
      : config.channels[locationKey]?.id;

    if (!channelId) {
      results.push({ location: locationKey, ok: false, error: 'No channel ID found' });
      continue;
    }

    const res = await invokeTool({
      connectionId: config.slack_connection_id,
      toolName: 'slack_post_message',
      args: { channelId, message, sendAsUser: true },
    });

    if (res.ok) {
      results.push({ location: locationKey, ok: true });
    } else {
      results.push({ location: locationKey, ok: false, error: res.error });
    }
  }

  const allOk = results.every(r => r.ok);
  console.log(JSON.stringify({
    ok: allOk,
    date: dateKey(date),
    day: dayName,
    testMode,
    results,
  }));
}

main().catch(e => {
  console.error(JSON.stringify({ ok: false, error: String(e) }));
  process.exit(1);
});
