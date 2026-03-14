import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.post(
  "/admin/therapists",
  authMiddleware(),
  adminMiddleware(),
  async (req, res) => {
    const { email, name, password, bio, specializations, qualifications, licenseNumber } = req.body || {};

    if (!email || !name) {
      return res.status(400).json({ error: "email_and_name_required" });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "email_taken" });
    }

    const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "THERAPIST",
        onboardingComplete: true,
      },
    });

    const profile = await prisma.therapistProfile.create({
      data: {
        userId: user.id,
        bio: bio || null,
        specializations: specializations || [],
        qualifications: qualifications || null,
        licenseNumber: licenseNumber || null,
      },
    });

    return res.json({ user, profile });
  }
);

router.get(
  "/admin/therapists",
  authMiddleware(),
  adminMiddleware(),
  async (_req, res) => {
    const therapists = await prisma.user.findMany({
      where: { role: "THERAPIST" },
      include: {
        therapistProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      therapists.map(async (t) => {
        const [sessionCount, noteCount, clientCount] = await Promise.all([
          prisma.booking.count({
            where: { session: { therapistId: t.therapistProfile?.id }, status: "paid" },
          }),
          prisma.therapyNote.count({ where: { therapistId: t.id } }),
          prisma.booking
            .groupBy({
              by: ["userId"],
              where: { session: { therapistId: t.therapistProfile?.id }, status: "paid" },
            })
            .then((g) => g.length),
        ]);
        return {
          ...t,
          stats: { sessionCount, noteCount, clientCount, noteCompletionRate: sessionCount > 0 ? Math.round((noteCount / sessionCount) * 100) : 0 },
        };
      })
    );

    return res.json({ therapists: enriched });
  }
);

router.patch(
  "/admin/therapists/:id",
  authMiddleware(),
  adminMiddleware(),
  async (req, res) => {
    const { id } = req.params;
    const { bio, specializations, qualifications, licenseNumber, isActive, name } = req.body || {};

    const profile = await prisma.therapistProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) {
      return res.status(404).json({ error: "therapist_not_found" });
    }

    const profileData: any = {};
    if (bio !== undefined) profileData.bio = bio;
    if (specializations !== undefined) profileData.specializations = specializations;
    if (qualifications !== undefined) profileData.qualifications = qualifications;
    if (licenseNumber !== undefined) profileData.licenseNumber = licenseNumber;
    if (isActive !== undefined) profileData.isActive = Boolean(isActive);

    const updated = await prisma.therapistProfile.update({
      where: { id },
      data: profileData,
      include: { user: true },
    });

    if (name !== undefined) {
      await prisma.user.update({ where: { id: profile.userId }, data: { name } });
    }

    return res.json({ therapist: updated });
  }
);

router.get(
  "/admin/analytics",
  authMiddleware(),
  adminMiddleware(),
  async (_req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      paidBookings,
      cancelledBookings,
      totalRevenue,
      activeClients,
      totalNotes,
      therapistCount,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "paid" } }),
      prisma.booking.count({ where: { status: "cancelled" } }),
      prisma.booking.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
      prisma.booking
        .groupBy({
          by: ["userId"],
          where: { status: "paid", createdAt: { gte: thirtyDaysAgo } },
        })
        .then((g) => g.length),
      prisma.therapyNote.count(),
      prisma.user.count({ where: { role: "THERAPIST" } }),
    ]);

    const completionRate = totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0;
    const noteCompletionRate = paidBookings > 0 ? Math.round((totalNotes / paidBookings) * 100) : 0;

    return res.json({
      analytics: {
        totalBookings,
        paidBookings,
        cancelledBookings,
        completionRate,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeClients,
        totalNotes,
        noteCompletionRate,
        therapistCount,
      },
    });
  }
);

router.get(
  "/admin/audit-log",
  authMiddleware(),
  adminMiddleware(),
  async (req, res) => {
    const { page = "1", pageSize = "50" } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(pageSize) || 50));

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * perPage,
        take: perPage,
        include: {
          adminUser: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return res.json({ logs, page: pageNum, pageSize: perPage, total });
  }
);

export default router;
