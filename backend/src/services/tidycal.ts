import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TIDYCAL_API_BASE = "https://tidycal.com/api";

interface TidyCalContact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  timezone?: string;
}

interface TidyCalBooking {
  id: number;
  contact_id: number;
  booking_type_id: number;
  starts_at: string;
  ends_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  timezone: string;
  meeting_url: string | null;
  meeting_id: string | null;
  contact: TidyCalContact;
}

interface TidyCalBookingsResponse {
  data: TidyCalBooking[];
}

export class TidyCalService {
  private token: string | null;

  constructor() {
    this.token = process.env.TIDYCAL_API_TOKEN || null;
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.token) {
      throw new Error("TIDYCAL_API_TOKEN not configured");
    }
    const url = new URL(`${TIDYCAL_API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TidyCal API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getBookings(): Promise<TidyCalBooking[]> {
    // Fetch all bookings (TidyCal returns paginated, but typically recent bookings)
    const response = await this.fetch<TidyCalBookingsResponse>("/bookings");
    return response.data;
  }

  async getBooking(bookingId: number): Promise<TidyCalBooking> {
    return this.fetch<TidyCalBooking>(`/bookings/${bookingId}`);
  }
}

export async function syncTidyCalBookings(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const service = new TidyCalService();
    
    if (!service.isConfigured()) {
      console.log("TidyCal sync skipped: TIDYCAL_API_TOKEN not configured");
      return { synced: 0, errors: [] };
    }

    // Fetch all bookings from TidyCal
    const tidyCalBookings = await service.getBookings();
    console.log(`TidyCal sync: Found ${tidyCalBookings.length} bookings`);

    for (const tcBooking of tidyCalBookings) {
      try {
        // Skip cancelled bookings
        if (tcBooking.cancelled_at) continue;

        // Find user by email
        const user = await prisma.user.findFirst({
          where: { email: tcBooking.contact.email.toLowerCase() },
        });

        if (!user) {
          continue; // User not in our system
        }

        // Check if we already synced this booking
        const existingByTidyCal = await prisma.booking.findUnique({
          where: { tidycalBookingId: tcBooking.id },
        });

        if (existingByTidyCal) {
          // Update existing synced booking if meeting URL changed
          if (tcBooking.meeting_url && existingByTidyCal.meetingUrl !== tcBooking.meeting_url) {
            await prisma.booking.update({
              where: { id: existingByTidyCal.id },
              data: {
                meetingUrl: tcBooking.meeting_url,
                actualStartTime: new Date(tcBooking.starts_at),
                actualEndTime: new Date(tcBooking.ends_at),
                tidycalSyncedAt: new Date(),
              },
            });
            synced++;
          }
          continue;
        }

        // Find a paid booking for this user that hasn't been synced yet
        // Match by: same user, paid status, no tidycal ID yet, created around same time
        const tcCreatedAt = new Date(tcBooking.created_at);
        const searchStart = new Date(tcCreatedAt.getTime() - 24 * 60 * 60 * 1000); // 1 day before
        const searchEnd = new Date(tcCreatedAt.getTime() + 24 * 60 * 60 * 1000); // 1 day after

        const matchingBooking = await prisma.booking.findFirst({
          where: {
            userId: user.id,
            status: "paid",
            tidycalBookingId: null,
            createdAt: {
              gte: searchStart,
              lte: searchEnd,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (matchingBooking) {
          await prisma.booking.update({
            where: { id: matchingBooking.id },
            data: {
              tidycalBookingId: tcBooking.id,
              meetingUrl: tcBooking.meeting_url,
              actualStartTime: new Date(tcBooking.starts_at),
              actualEndTime: new Date(tcBooking.ends_at),
              tidycalSyncedAt: new Date(),
            },
          });
          synced++;
          console.log(`TidyCal sync: Linked booking ${matchingBooking.id} to TidyCal #${tcBooking.id}`);
        }
      } catch (err: any) {
        errors.push(`Booking ${tcBooking.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Sync error: ${err.message}`);
  }

  console.log(`TidyCal sync complete: ${synced} bookings synced, ${errors.length} errors`);
  return { synced, errors };
}

export async function getTidyCalStatus(): Promise<{
  configured: boolean;
  lastSync?: Date;
  recentSynced: number;
}> {
  const configured = !!process.env.TIDYCAL_API_TOKEN;

  if (!configured) {
    return { configured: false, recentSynced: 0 };
  }

  const recentSynced = await prisma.booking.count({
    where: {
      tidycalSyncedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const lastSyncedBooking = await prisma.booking.findFirst({
    where: { tidycalSyncedAt: { not: null } },
    orderBy: { tidycalSyncedAt: "desc" },
    select: { tidycalSyncedAt: true },
  });

  return {
    configured: true,
    lastSync: lastSyncedBooking?.tidycalSyncedAt || undefined,
    recentSynced,
  };
}
