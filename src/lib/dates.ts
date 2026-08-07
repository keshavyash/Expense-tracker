// "Today" needs to mean the same calendar date whether it's computed on
// Vercel's server (which runs in UTC, regardless of which region the
// function executes in) or in the browser (which uses the phone's local
// time — IST). Relying on ambient local time for either meant the two
// could disagree near midnight IST, which showed up as the reports date
// picker randomly defaulting to "Custom" instead of "This month". These
// helpers pin everything to Asia/Kolkata explicitly so both sides always
// compute the identical date.

const TIMEZONE = "Asia/Kolkata";

function istParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Today's date as YYYY-MM-DD, in Asia/Kolkata. */
export function todayIST(): string {
  const { year, month, day } = istParts();
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Current year and 1-indexed month in Asia/Kolkata. */
export function currentYearMonthIST(): { year: number; month: number } {
  const { year, month } = istParts();
  return { year, month };
}

/** First day of the month `monthsAgo` months back from now (0 = this month), IST. */
export function firstOfMonthIST(monthsAgo = 0): string {
  const { year, month } = istParts();
  const d = new Date(Date.UTC(year, month - 1 - monthsAgo, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
}

/** Last day of the month `monthsAgo` months back from now (0 = this month), IST. */
export function lastOfMonthIST(monthsAgo = 0): string {
  const { year, month } = istParts();
  const d = new Date(Date.UTC(year, month - monthsAgo, 0)); // day 0 = last day of prior month
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** January 1 of the current year, IST. */
export function firstOfYearIST(): string {
  const { year } = istParts();
  return `${year}-01-01`;
}

/** First/last day of an explicit (year, 1-indexed month), no "now" involved. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { from, to };
}
