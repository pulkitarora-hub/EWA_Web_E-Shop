import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { decryptField } from "../services/encryption.js";

const router = Router();
const prisma = new PrismaClient();

function decryptNote(note: any) {
  if (!note) return note;
  return {
    ...note,
    sessionSummary: decryptField(note.sessionSummary),
    actionItems: decryptField(note.actionItems),
    nextSessionFocus: decryptField(note.nextSessionFocus),
    interventions: decryptField(note.interventions),
  };
}

function stripPrivateFields(note: any) {
  if (!note) return note;
  const { internalNotes, observations, ...shared } = note;
  return shared;
}

router.get("/my-profile", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  let profile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.clientProfile.create({ data: { userId: user.id } });
  }
  return res.json({ profile });
});

router.put("/my-profile", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { emergencyContact, emergencyPhone, therapyGoals, intakeNotes, dateOfBirth } = req.body || {};

  const data: any = {};
  if (emergencyContact !== undefined) data.emergencyContact = emergencyContact;
  if (emergencyPhone !== undefined) data.emergencyPhone = emergencyPhone;
  if (therapyGoals !== undefined) data.therapyGoals = therapyGoals;
  if (intakeNotes !== undefined) data.intakeNotes = intakeNotes;
  if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

  const profile = await prisma.clientProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return res.json({ profile });
});

router.get(
  "/therapist/clients/:id/profile",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const { id } = req.params;
    const client = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, goal: true, createdAt: true },
    });
    if (!client) {
      return res.status(404).json({ error: "client_not_found" });
    }
    const profile = await prisma.clientProfile.findUnique({ where: { userId: id } });
    return res.json({ client, profile });
  }
);

router.get("/my-timeline", authMiddleware(), async (req, res) => {
  const user = (req as any).user;

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, status: "paid" },
    include: {
      session: true,
      therapyNote: {
        include: { tags: true },
      },
    },
    orderBy: { session: { startTime: "desc" } },
  });

  const timeline = bookings.map((b) => {
    const note = b.therapyNote;
    const hasSharedNote = note && note.visibility !== "PRIVATE";
    return {
      bookingId: b.id,
      sessionTitle: b.session.title,
      sessionDate: b.session.startTime,
      sessionHost: b.session.host,
      note: hasSharedNote ? stripPrivateFields(decryptNote(note)) : null,
    };
  });

  return res.json({ timeline });
});

router.get("/my-notes", authMiddleware(), async (req, res) => {
  const user = (req as any).user;

  const notes = await prisma.therapyNote.findMany({
    where: {
      clientId: user.id,
      visibility: { not: "PRIVATE" },
    },
    include: {
      tags: true,
      booking: { include: { session: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    notes: notes.map((n) => stripPrivateFields(decryptNote(n))),
  });
});

router.get("/my-notes/:id", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const note = await prisma.therapyNote.findUnique({
    where: { id },
    include: { tags: true, booking: { include: { session: true } } },
  });

  if (!note || note.clientId !== user.id) {
    return res.status(404).json({ error: "note_not_found" });
  }
  if (note.visibility === "PRIVATE") {
    return res.status(403).json({ error: "note_not_shared" });
  }

  return res.json({ note: stripPrivateFields(decryptNote(note)) });
});

export default router;

// ─── Client Dashboard ─────────────────────────────────────────────────────────
router.get("/client/dashboard", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const now = new Date();

  try {
    // Upcoming bookings (next 3 paid bookings with future sessions)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "paid",
        session: { startTime: { gte: now } },
      },
      include: {
        session: true,
        zoomMeeting: true,
      },
      orderBy: { session: { startTime: "asc" } },
      take: 3,
    });

    // Session credits from packages
    const userPackages = await prisma.userPackage.findMany({
      where: {
        userId: user.id,
        status: "paid",
      },
      include: { package: true },
    });

    const totalCredits = userPackages.reduce((sum, up) => sum + up.creditsTotal, 0);
    const usedCredits = userPackages.reduce((sum, up) => sum + up.creditsUsed, 0);
    const availableCredits = totalCredits - usedCredits;

    // Active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: { nextBillingAt: "asc" },
    });

    // Recent shared notes (last 5)
    const recentNotes = await prisma.therapyNote.findMany({
      where: {
        clientId: user.id,
        visibility: { not: "PRIVATE" },
      },
      include: {
        booking: { include: { session: true } },
        tags: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Mood trend (last 10 notes with mood ratings)
    const moodData = await prisma.therapyNote.findMany({
      where: {
        clientId: user.id,
        visibility: { not: "PRIVATE" },
        moodRating: { not: null },
      },
      select: {
        moodRating: true,
        createdAt: true,
        booking: { select: { session: { select: { startTime: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Total sessions completed
    const completedSessions = await prisma.booking.count({
      where: {
        userId: user.id,
        status: "paid",
        session: { startTime: { lt: now } },
      },
    });

    // Format response
    const dashboard = {
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        sessionTitle: b.session.title,
        sessionHost: b.session.host,
        startTime: b.session.startTime,
        tidycalUrl: b.session.tidycalUrl,
        zoomJoinUrl: b.meetingUrl || b.zoomMeeting?.joinUrl || null,
        zoomMeetingStatus: b.zoomMeeting?.status || null,
        actualStartTime: b.actualStartTime || null,
      })),
      credits: {
        available: availableCredits,
        total: totalCredits,
        used: usedCredits,
        packages: userPackages.map((up) => ({
          id: up.id,
          name: up.package.name,
          remaining: up.creditsTotal - up.creditsUsed,
          total: up.creditsTotal,
        })),
      },
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        sessionTitle: s.sessionTitle,
        frequency: s.frequency,
        nextBillingAt: s.nextBillingAt,
        status: s.status,
      })),
      journey: {
        completedSessions,
        sharedNotesCount: recentNotes.length,
        recentNotes: recentNotes.map((n) => ({
          id: n.id,
          sessionTitle: n.booking?.session?.title || "Session",
          sessionDate: n.booking?.session?.startTime,
          visibility: n.visibility,
          keyThemes: n.keyThemes,
          moodRating: n.moodRating,
        })),
        moodTrend: moodData.map((n) => ({
          date: n.booking?.session?.startTime || n.createdAt,
          rating: n.moodRating,
        })).reverse(),
      },
    };

    return res.json(dashboard);
  } catch (error) {
    console.error("Client dashboard error:", error);
    return res.status(500).json({ error: "dashboard_load_failed" });
  }
});
