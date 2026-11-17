import { NextResponse, type NextRequest } from "next/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { todayCentralIso } from "@/lib/birthday";
import {
  BIRTHDAY_REMINDER_TO,
  buildBirthdayEmail,
  loadUpcomingBirthdays,
  sendEmail,
} from "@/lib/birthdayReminder";

// Called once a morning by Vercel Cron (see vercel.json). Emails a reminder
// only when someone's birthday is today or exactly a week away, so most days
// nothing is sent. Vercel sends "Authorization: Bearer <CRON_SECRET>"; with no
// secret configured the route refuses to run at all.
//   ?dry=1  -> shows what would be sent without sending anything
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasServiceRole()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  }

  const today = todayCentralIso();
  const upcoming = await loadUpcomingBirthdays(today, 7);
  const items = upcoming.filter((i) => i.daysAway === 0 || i.daysAway === 7);

  if (items.length === 0) return NextResponse.json({ today, sent: false, reason: "No birthdays today or in 7 days." });

  const email = buildBirthdayEmail(items, "Birthday reminder");
  if (req.nextUrl.searchParams.get("dry")) {
    return NextResponse.json({ today, sent: false, dryRun: true, to: BIRTHDAY_REMINDER_TO, ...email });
  }

  const result = await sendEmail(email);
  if (!result.ok) return NextResponse.json({ today, sent: false, error: result.error }, { status: 502 });
  return NextResponse.json({ today, sent: true, count: items.length });
}
