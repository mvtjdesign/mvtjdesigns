// Storage for the website assistant: chat transcripts, leads and inbound email replies.
// Uses the Supabase Postgres connected to the Vercel project (POSTGRES_URL, the pooled connection).
// Every function is a no-op when no database is configured, so the chat keeps working without one.
import postgres from "postgres";

const URL = process.env.POSTGRES_URL;
const CHAT_RETENTION_DAYS = 90;
const sql = URL ? postgres(URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 }) : null;

let ready = null;
// Creates the tables on first use; IF NOT EXISTS keeps it safe on every cold start.
function schema() {
  ready ||= sql.begin(async tx => {
    await tx`create table if not exists mvtj_chats (
      id uuid primary key,
      lang text not null,
      started_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      transcript jsonb not null,
      lead_id bigint)`;
    await tx`create table if not exists mvtj_leads (
      id bigint generated always as identity primary key,
      created_at timestamptz not null default now(),
      source text not null default 'chat',
      chat_id uuid,
      lang text, door text, service text, business text, need text, timing text, summary text,
      score int, band text,
      name text, reach text,
      reply_consent_at timestamptz,
      marketing_opt_in boolean not null default false,
      marketing_consent_text text,
      marketing_consent_at timestamptz)`;
    await tx`create table if not exists mvtj_email_events (
      id bigint generated always as identity primary key,
      received_at timestamptz not null default now(),
      gmail_message_id text unique not null,
      from_domain text, organisation text, subject text,
      summary text, sentiment text, next_step text)`;
    // Supabase exposes public tables through its API; keep these server-only.
    for (const table of ["mvtj_chats", "mvtj_leads", "mvtj_email_events"]) {
      await tx.unsafe(`alter table ${table} enable row level security`);
    }
  }).catch(error => { ready = null; throw error; });
  return ready;
}

// Phone numbers and email addresses typed into the chat are removed before anything is saved.
export function redact(text) {
  return String(text)
    .replace(/[^\s@,;:<>()]+@[^\s@,;:<>()]+\.[A-Za-z]{2,}/g, "[email removed]")
    // Seven or more digits reads as a phone number; year ranges and prices stay.
    .replace(/\+?\d[\d\s().-]{5,}\d/g, m => (m.replace(/\D/g, "").length >= 7 && !/^(19|20)\d\d\s*[-–]\s*(19|20)\d\d$/.test(m) ? "[number removed]" : m));
}

export async function saveChat(id, lang, messages) {
  if (!sql || !/^[0-9a-f-]{36}$/.test(id || "")) return;
  await schema();
  const transcript = messages.map(m => ({ role: m.role, content: redact(m.content) }));
  await sql`insert into mvtj_chats (id, lang, transcript) values (${id}, ${lang}, ${sql.json(transcript)})
    on conflict (id) do update set transcript = excluded.transcript, updated_at = now()`;
  // Retention: chats older than 90 days are deleted (cheap, runs alongside normal traffic).
  await sql`delete from mvtj_chats where updated_at < now() - make_interval(days => ${CHAT_RETENTION_DAYS})`;
}

export async function chatTranscript(id) {
  if (!sql || !/^[0-9a-f-]{36}$/.test(id || "")) return [];
  await schema();
  const [row] = await sql`select transcript from mvtj_chats where id = ${id}`;
  return row?.transcript || [];
}

export async function saveLead(lead, contact, chatId, marketing) {
  if (!sql) return null;
  await schema();
  const [row] = await sql`insert into mvtj_leads
    (chat_id, lang, door, service, business, need, timing, summary, score, band, name, reach,
     reply_consent_at, marketing_opt_in, marketing_consent_text, marketing_consent_at)
    values (${/^[0-9a-f-]{36}$/.test(chatId || "") ? chatId : null}, ${lead.lang}, ${lead.door}, ${lead.service}, ${lead.business},
      ${lead.need}, ${lead.timing}, ${lead.summary}, ${lead.score}, ${lead.band}, ${contact.name || null}, ${contact.reach || null},
      now(), ${marketing.optIn}, ${marketing.optIn ? marketing.text : null}, ${marketing.optIn ? sql`now()` : null})
    returning id`;
  if (row && chatId) await sql`update mvtj_chats set lead_id = ${row.id} where id = ${chatId}`;
  return row?.id ?? null;
}

// Returns false when this Gmail message was already logged.
export async function saveEmailEvent(event) {
  if (!sql) return true;
  await schema();
  const rows = await sql`insert into mvtj_email_events
    (gmail_message_id, from_domain, organisation, subject, summary, sentiment, next_step)
    values (${event.id}, ${event.domain}, ${event.organisation}, ${event.subject}, ${event.summary}, ${event.sentiment}, ${event.nextStep})
    on conflict (gmail_message_id) do nothing returning id`;
  return rows.length > 0;
}
