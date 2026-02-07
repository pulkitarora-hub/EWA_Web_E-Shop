import { Resend } from "resend";
import * as ics from "ics";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SessionInfo = {
  title: string;
  host: string;
  startTime: Date | string;
};

type BookingInfo = {
  id: string;
  amount: number;
  currency: string;
};

type UserInfo = {
  name?: string | null;
  email?: string | null;
};

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function toIcsDateArray(d: Date): [number, number, number, number, number] {
  return [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  ];
}

export function generateIcsEvent(session: SessionInfo): string {
  const start = toDate(session.startTime);
  const { error, value } = ics.createEvent({
    title: session.title,
    description: `Session with ${session.host}`,
    start: toIcsDateArray(start),
    duration: { hours: 1 },
    organizer: { name: session.host },
  });
  if (error || !value) {
    console.error("ICS generation error:", error);
    return "";
  }
  return value;
}

export function generateGoogleCalendarLink(session: SessionInfo): string {
  const start = toDate(session.startTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: session.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Session with ${session.host}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function sendBookingConfirmation(
  user: UserInfo,
  session: SessionInfo,
  booking: BookingInfo
) {
  if (!user.email) {
    console.log("No email for user, skipping confirmation email.");
    return;
  }
  if (!resend) {
    console.log("Resend not configured, skipping email. Set RESEND_API_KEY.");
    return;
  }

  const icsContent = generateIcsEvent(session);
  const gcalLink = generateGoogleCalendarLink(session);
  const startDate = toDate(session.startTime);
  const formattedDate = startDate.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const html = `
    <h2>Booking Confirmed!</h2>
    <p>Hi ${user.name || "there"},</p>
    <p>Your session has been booked successfully.</p>
    <table>
      <tr><td><strong>Session:</strong></td><td>${session.title}</td></tr>
      <tr><td><strong>Host:</strong></td><td>${session.host}</td></tr>
      <tr><td><strong>Date/Time:</strong></td><td>${formattedDate}</td></tr>
      <tr><td><strong>Amount:</strong></td><td>${booking.currency} ${booking.amount}</td></tr>
    </table>
    <br/>
    <p>
      <a href="${gcalLink}" style="background:#4285f4;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">
        Add to Google Calendar
      </a>
    </p>
    <p style="margin-top:16px;color:#666;">
      You can also open the attached .ics file to add this event to any calendar app.
    </p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Booking Confirmed: ${session.title}`,
      html,
      attachments: icsContent
        ? [
            {
              filename: "session.ics",
              content: Buffer.from(icsContent).toString("base64"),
            },
          ]
        : [],
    });
    console.log(`Confirmation email sent to ${user.email}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
