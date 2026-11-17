// Birthdays are stored as month + day, with an optional year (some people
// would rather not share it). Month and day are always set together.

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Feb allows the 29th

export type Birthday = { month: number | null; day: number | null; year: number | null };

export function isValidMonthDay(month: number, day: number) {
  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= DAYS_IN_MONTH[month - 1]
  );
}

// "March 14" or "March 14, 1980"; null when no birthday is on file.
export function formatBirthday(b: Birthday, short = false): string | null {
  if (!b.month || !b.day) return null;
  const name = short ? MONTHS[b.month - 1].slice(0, 3) : MONTHS[b.month - 1];
  return b.year ? `${name} ${b.day}, ${b.year}` : `${name} ${b.day}`;
}

// Whole days from `todayIso` (YYYY-MM-DD) until the next occurrence of the
// birthday: 0 = today. Feb 29 birthdays are celebrated on Feb 28 in
// non-leap years. Null when no birthday is on file.
export function daysUntilBirthday(b: Birthday, todayIso: string): number | null {
  if (!b.month || !b.day) return null;
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const today = Date.UTC(ty, tm - 1, td);
  const next = (year: number) => {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const day = b.month === 2 && b.day === 29 && !leap ? 28 : b.day!;
    return Date.UTC(year, b.month! - 1, day);
  };
  let target = next(ty);
  if (target < today) target = next(ty + 1);
  return Math.round((target - today) / 86_400_000);
}

export function todayCentralIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}
