import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.get("/admin/sessions", authMiddleware(), adminMiddleware(), async (_req, res) => {
  const sessions = await prisma.session.findMany({
    include: { therapist: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ sessions });
});

router.post("/admin/sessions", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { title, host, startTime, price, currency, tidycalUrl, therapistId } = req.body || {};
  if (!title || !host) return res.status(400).json({ error: "title_and_host_required" });
  const start = startTime ? new Date(startTime) : new Date();
  const session = await prisma.session.create({
    data: {
      title: String(title).trim(),
      host: String(host).trim(),
      startTime: start,
      price: typeof price === "number" ? price : parseInt(String(price || 0), 10) || 0,
      currency: (currency && String(currency).trim()) || "INR",
      tidycalUrl: tidycalUrl ? String(tidycalUrl).trim() : null,
      therapistId: therapistId && String(therapistId).trim() ? String(therapistId).trim() : null,
    },
    include: { therapist: { include: { user: { select: { name: true, email: true } } } } },
  });
  return res.status(201).json({ session });
});

router.patch("/admin/sessions/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  const { title, host, startTime, price, currency, tidycalUrl, therapistId } = req.body || {};
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "session_not_found" });
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = String(title).trim();
  if (host !== undefined) data.host = String(host).trim();
  if (startTime !== undefined) data.startTime = new Date(startTime);
  if (price !== undefined) data.price = typeof price === "number" ? price : parseInt(String(price), 10) || 0;
  if (currency !== undefined) data.currency = String(currency).trim() || "INR";
  if (tidycalUrl !== undefined) data.tidycalUrl = tidycalUrl ? String(tidycalUrl).trim() : null;
  if (therapistId !== undefined) data.therapistId = therapistId && String(therapistId).trim() ? String(therapistId).trim() : null;
  const session = await prisma.session.update({ where: { id }, data, include: { therapist: { include: { user: { select: { name: true, email: true } } } } } });
  return res.json({ session });
});

router.delete("/admin/sessions/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "session_not_found" });
  await prisma.session.delete({ where: { id } });
  return res.json({ success: true });
});

export default router;
