import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  ZoomService,
  saveZoomConfig,
  getZoomConfigStatus,
  testZoomConnection,
  createZoomMeetingForBooking,
  syncZoomRecordings,
} from "../services/zoom.js";

const router = Router();
const prisma = new PrismaClient();

// ─── Webhook Verification ─────────────────────────────────────────────────────

function verifyZoomWebhook(req: any): boolean {
  const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secretToken) return true;

  const signature = req.headers["x-zm-signature"];
  const timestamp = req.headers["x-zm-request-timestamp"];

  if (!signature || !timestamp) return false;

  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto
    .createHmac("sha256", secretToken)
    .update(message)
    .digest("hex");
  const expectedSignature = `v0=${hashForVerify}`;

  return signature === expectedSignature;
}

// ─── Zoom Webhook Endpoint ────────────────────────────────────────────────────

router.post("/zoom/webhook", async (req, res) => {
  try {
    if (req.body.event === "endpoint.url_validation") {
      const plainToken = req.body.payload?.plainToken;
      const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || "";
      const encryptedToken = crypto
        .createHmac("sha256", secretToken)
        .update(plainToken)
        .digest("hex");

      return res.json({
        plainToken,
        encryptedToken,
      });
    }

    if (!verifyZoomWebhook(req)) {
      console.warn("Invalid Zoom webhook signature");
      return res.status(401).json({ error: "invalid_signature" });
    }

    const { event, payload } = req.body;
    console.log(`Zoom webhook received: ${event}`);

    switch (event) {
      case "meeting.started": {
        const meetingId = String(payload.object.id);
        await prisma.zoomMeeting.updateMany({
          where: { zoomMeetingId: meetingId },
          data: { status: "started" },
        });
        break;
      }

      case "meeting.ended": {
        const meetingId = String(payload.object.id);
        await prisma.zoomMeeting.updateMany({
          where: { zoomMeetingId: meetingId },
          data: { status: "ended" },
        });
        break;
      }

      case "recording.completed": {
        const meetingId = String(payload.object.id);
        try {
          await syncZoomRecordings(meetingId);
        } catch (err) {
          console.error("Failed to sync recordings:", err);
        }
        break;
      }

      case "recording.transcript_completed": {
        const meetingId = String(payload.object.id);
        try {
          await syncZoomRecordings(meetingId);
        } catch (err) {
          console.error("Failed to sync transcript:", err);
        }
        break;
      }

      default:
        console.log(`Unhandled Zoom event: ${event}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Zoom webhook error:", error);
    return res.status(500).json({ error: "webhook_processing_failed" });
  }
});

// ─── Admin Zoom Configuration ─────────────────────────────────────────────────

router.get("/admin/zoom/config", authMiddleware(), adminMiddleware(), async (req, res) => {
  try {
    const status = await getZoomConfigStatus();
    return res.json(status);
  } catch (error) {
    console.error("Get Zoom config error:", error);
    return res.status(500).json({ error: "failed_to_get_config" });
  }
});

router.post("/admin/zoom/config", authMiddleware(), adminMiddleware(), async (req, res) => {
  try {
    const { accountId, clientId, clientSecret } = req.body;

    if (!accountId || !clientId || !clientSecret) {
      return res.status(400).json({ error: "missing_credentials" });
    }

    const config = await saveZoomConfig(accountId, clientId, clientSecret);

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: (req as any).user.id,
        action: "ZOOM_CONFIG_UPDATED",
        metadata: { accountId, clientId },
      },
    });

    return res.json({
      success: true,
      config: {
        id: config.id,
        accountId: config.accountId,
        clientId: config.clientId,
      },
    });
  } catch (error: any) {
    console.error("Save Zoom config error:", error);
    return res.status(500).json({ error: error.message || "failed_to_save_config" });
  }
});

router.post("/admin/zoom/test", authMiddleware(), adminMiddleware(), async (req, res) => {
  try {
    const result = await testZoomConnection();
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

// ─── Booking Zoom Meeting ─────────────────────────────────────────────────────

router.post(
  "/bookings/:bookingId/zoom-meeting",
  authMiddleware(),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const user = (req as any).user;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true },
      });

      if (!booking) {
        return res.status(404).json({ error: "booking_not_found" });
      }

      if (booking.userId !== user.id && user.role !== "ADMIN" && user.role !== "THERAPIST") {
        return res.status(403).json({ error: "forbidden" });
      }

      const meeting = await createZoomMeetingForBooking(bookingId);

      return res.json({ meeting });
    } catch (error: any) {
      console.error("Create Zoom meeting error:", error);
      return res.status(500).json({ error: error.message || "failed_to_create_meeting" });
    }
  }
);

router.get(
  "/bookings/:bookingId/zoom-meeting",
  authMiddleware(),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const user = (req as any).user;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          zoomMeeting: {
            include: { recordings: true },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ error: "booking_not_found" });
      }

      if (booking.userId !== user.id && user.role !== "ADMIN" && user.role !== "THERAPIST") {
        return res.status(403).json({ error: "forbidden" });
      }

      if (!booking.zoomMeeting) {
        return res.json({ meeting: null });
      }

      const isTherapistOrAdmin = user.role === "THERAPIST" || user.role === "ADMIN";

      return res.json({
        meeting: {
          id: booking.zoomMeeting.id,
          zoomMeetingId: booking.zoomMeeting.zoomMeetingId,
          joinUrl: booking.zoomMeeting.joinUrl,
          startUrl: isTherapistOrAdmin ? booking.zoomMeeting.startUrl : undefined,
          password: booking.zoomMeeting.password,
          status: booking.zoomMeeting.status,
          recordings: isTherapistOrAdmin ? booking.zoomMeeting.recordings : [],
        },
      });
    } catch (error: any) {
      console.error("Get Zoom meeting error:", error);
      return res.status(500).json({ error: error.message || "failed_to_get_meeting" });
    }
  }
);

// ─── Recordings ───────────────────────────────────────────────────────────────

router.get(
  "/bookings/:bookingId/recordings",
  authMiddleware(),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const user = (req as any).user;

      if (user.role !== "THERAPIST" && user.role !== "ADMIN") {
        return res.status(403).json({ error: "forbidden" });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          zoomMeeting: {
            include: { recordings: true },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ error: "booking_not_found" });
      }

      return res.json({
        recordings: booking.zoomMeeting?.recordings || [],
      });
    } catch (error: any) {
      console.error("Get recordings error:", error);
      return res.status(500).json({ error: error.message || "failed_to_get_recordings" });
    }
  }
);

router.post(
  "/bookings/:bookingId/sync-recordings",
  authMiddleware(),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const user = (req as any).user;

      if (user.role !== "THERAPIST" && user.role !== "ADMIN") {
        return res.status(403).json({ error: "forbidden" });
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { zoomMeeting: true },
      });

      if (!booking?.zoomMeeting) {
        return res.status(404).json({ error: "no_zoom_meeting" });
      }

      const recordings = await syncZoomRecordings(booking.zoomMeeting.zoomMeetingId);

      return res.json({ recordings });
    } catch (error: any) {
      console.error("Sync recordings error:", error);
      return res.status(500).json({ error: error.message || "failed_to_sync_recordings" });
    }
  }
);

export default router;

// ─── TidyCal Sync Endpoints ───────────────────────────────────────────────────

import { syncTidyCalBookings, getTidyCalStatus } from "../services/tidycal.js";

router.get("/admin/tidycal/status", authMiddleware(), adminMiddleware(), async (req, res) => {
  try {
    const status = await getTidyCalStatus();
    return res.json(status);
  } catch (error: any) {
    console.error("TidyCal status error:", error);
    return res.status(500).json({ error: error.message || "failed_to_get_status" });
  }
});

router.post("/admin/tidycal/sync", authMiddleware(), adminMiddleware(), async (req, res) => {
  try {
    const result = await syncTidyCalBookings();
    return res.json(result);
  } catch (error: any) {
    console.error("TidyCal sync error:", error);
    return res.status(500).json({ error: error.message || "sync_failed" });
  }
});
