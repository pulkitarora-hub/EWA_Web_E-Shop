import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.get(
  "/therapist/dashboard",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [todaySessions, upcomingSessions, pendingNotesCount, totalClients] =
      await Promise.all([
        prisma.booking.findMany({
          where: {
            session: { therapistId: user.therapistProfile?.id, startTime: { gte: startOfDay, lt: endOfDay } },
            status: "paid",
          },
          include: { session: true, user: { select: { id: true, name: true, email: true, avatarUrl: true } }, therapyNote: true, zoomMeeting: true },
          orderBy: { session: { startTime: "asc" } },
        }),
        prisma.booking.findMany({
          where: {
            session: { therapistId: user.therapistProfile?.id, startTime: { gt: endOfDay } },
            status: "paid",
          },
          include: { session: true, user: { select: { id: true, name: true, email: true } }, zoomMeeting: true },
          orderBy: { session: { startTime: "asc" } },
          take: 10,
        }),
        prisma.booking.count({
          where: {
            session: { therapistId: user.therapistProfile?.id, startTime: { lt: now } },
            status: "paid",
            therapyNote: null,
          },
        }),
        prisma.booking.groupBy({
          by: ["userId"],
          where: { session: { therapistId: user.therapistProfile?.id }, status: "paid" },
        }),
      ]);

    return res.json({
      todaySessions,
      upcomingSessions,
      pendingNotesCount,
      totalClients: totalClients.length,
    });
  }
);

router.get(
  "/therapist/clients",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const { search } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        session: { therapistId: user.therapistProfile?.id },
        status: "paid",
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        session: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const clientMap = new Map<string, any>();
    for (const b of bookings) {
      const existing = clientMap.get(b.userId);
      if (!existing) {
        clientMap.set(b.userId, {
          ...b.user,
          totalSessions: 1,
          lastSessionDate: b.session.startTime,
        });
      } else {
        existing.totalSessions += 1;
        if (new Date(b.session.startTime) > new Date(existing.lastSessionDate)) {
          existing.lastSessionDate = b.session.startTime;
        }
      }
    }

    let clients = Array.from(clientMap.values());
    if (typeof search === "string" && search.trim()) {
      const term = search.toLowerCase();
      clients = clients.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
    }

    clients.sort((a: any, b: any) => new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime());
    return res.json({ clients });
  }
);

router.get(
  "/therapist/clients/:clientId/timeline",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const { clientId } = req.params;

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!client) {
      return res.status(404).json({ error: "client_not_found" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: clientId,
        session: { therapistId: user.therapistProfile?.id },
        status: "paid",
      },
      include: {
        session: true,
        therapyNote: { include: { tags: true } },
      },
      orderBy: { session: { startTime: "desc" } },
    });

    return res.json({ client, timeline: bookings });
  }
);

router.get(
  "/therapist/sessions/today",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const sessions = await prisma.booking.findMany({
      where: {
        session: { therapistId: user.therapistProfile?.id, startTime: { gte: startOfDay, lt: endOfDay } },
        status: "paid",
      },
      include: {
        session: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        therapyNote: true,
      },
      orderBy: { session: { startTime: "asc" } },
    });

    return res.json({ sessions });
  }
);

router.get(
  "/therapist/sessions/upcoming",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;

    const sessions = await prisma.booking.findMany({
      where: {
        session: { therapistId: user.therapistProfile?.id, startTime: { gt: new Date() } },
        status: "paid",
      },
      include: {
        session: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { session: { startTime: "asc" } },
      take: 20,
    });

    return res.json({ sessions });
  }
);

router.get(
  "/therapist/notes/pending",
  authMiddleware(),
  requireRole("THERAPIST"),
  async (req, res) => {
    const user = (req as any).user;

    const bookings = await prisma.booking.findMany({
      where: {
        session: { therapistId: user.therapistProfile?.id, startTime: { lt: new Date() } },
        status: "paid",
        therapyNote: null,
      },
      include: {
        session: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { session: { startTime: "desc" } },
    });

    return res.json({ pendingBookings: bookings });
  }
);

export default router;
