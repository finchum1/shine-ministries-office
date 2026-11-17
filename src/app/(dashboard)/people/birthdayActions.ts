"use server";

import { createClient } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { todayCentralIso } from "@/lib/birthday";
import {
  BIRTHDAY_REMINDER_TO,
  buildBirthdayEmail,
  loadUpcomingBirthdays,
  sendEmail,
} from "@/lib/birthdayReminder";

export type SendNowState = { ok: boolean; message: string } | null;

// "Email me the upcoming birthdays now" -- sends the next 30 days to the
// reminder address, so the setup can be checked without waiting for a
// birthday. Staff only.
export async function sendBirthdaySummaryNow(): Promise<SendNowState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  if (!hasServiceRole()) return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const items = await loadUpcomingBirthdays(todayCentralIso(), 30);
  if (items.length === 0) {
    return { ok: true, message: "No birthdays in the next 30 days, so nothing was sent." };
  }
  const result = await sendEmail(buildBirthdayEmail(items, "Birthdays in the next 30 days"));
  return result.ok
    ? { ok: true, message: `Sent to ${BIRTHDAY_REMINDER_TO}.` }
    : { ok: false, message: result.error };
}
