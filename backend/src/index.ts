import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { sendBookingConfirmation } from "./email.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const otpStore = new Map<
  string,
  { phone: string; otp: string; expiresAt: number }
>();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function getUserFromToken(token?: string) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

function authMiddleware() {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    (req as any).user = user;
    next();
  };
}

function adminMiddleware() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ error: "admin_required" });
    }
    next();
  };
}

app.post("/auth/request-otp", async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: "phone_required" });
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpToken = crypto.randomBytes(16).toString("hex");
  otpStore.set(otpToken, {
    phone,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return res.json({ otpToken, otp });
});

app.post("/auth/verify-otp", async (req, res) => {
  const { otpToken, otp } = req.body || {};
  const record = otpStore.get(otpToken);
  if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
    return res.status(400).json({ error: "invalid_otp" });
  }
  otpStore.delete(otpToken);
  const user = await prisma.user.upsert({
    where: { phone: record.phone },
    create: { phone: record.phone },
    update: {},
  });
  const token = signToken(user.id);
  return res.json({ token, user });
});

app.get("/me", authMiddleware(), async (req, res) => {
  return res.json({ user: (req as any).user });
});

app.patch("/users/me", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { name, goal, email, onboardingComplete } = req.body || {};
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      goal,
      email,
      onboardingComplete: Boolean(onboardingComplete),
    },
  });
  return res.json({ user: updated });
});

app.get("/sessions", async (_req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { startTime: "asc" },
  });
  return res.json({ sessions });
});

app.post("/sessions", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { title, host, startTime, price, currency, tidycalUrl } = req.body || {};
  if (!title || !host || !startTime || !price || !currency) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const session = await prisma.session.create({
    data: { title, host, startTime: new Date(startTime), price, currency, tidycalUrl },
  });
  return res.json({ session });
});

app.post("/bookings", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { sessionId } = req.body || {};
  if (!sessionId) {
    return res.status(400).json({ error: "session_required" });
  }
  if (!razorpay) {
    return res.status(400).json({ error: "razorpay_not_configured" });
  }
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return res.status(404).json({ error: "session_not_found" });
  }
  const order = await razorpay.orders.create({
    amount: session.price * 100,
    currency: session.currency,
    receipt: `booking_${Date.now()}`,
    notes: { sessionId, userId: user.id },
  });
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      status: "pending",
      amount: session.price,
      currency: session.currency,
      razorpayOrderId: order.id,
    },
  });
  return res.json({
    bookingId: booking.id,
    orderId: order.id,
    amount: booking.amount,
    currency: booking.currency,
    razorpayKeyId: RAZORPAY_KEY_ID,
  });
});

app.post("/payments/verify", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body || {};
  if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== user.id) {
    return res.status(404).json({ error: "booking_not_found" });
  }
  if (booking.razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({ error: "order_mismatch" });
  }
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  if (expected !== razorpaySignature) {
    return res.status(400).json({ error: "invalid_signature" });
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "paid", paidAt: new Date() },
  });
  await prisma.payment.create({
    data: {
      bookingId: bookingId,
      userId: user.id,
      razorpayOrderId,
      razorpayPaymentId,
      status: "captured",
    },
  });

  // Send confirmation email with calendar event
  const session = await prisma.session.findUnique({
    where: { id: updated.sessionId },
  });
  if (session) {
    sendBookingConfirmation(user, session, updated).catch((err) =>
      console.error("Email send failed:", err)
    );
  }

  return res.json({ booking: updated });
});

app.get("/admin/users", authMiddleware(), adminMiddleware(), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ users });
});

app.get(
  "/admin/bookings",
  authMiddleware(),
  adminMiddleware(),
  async (_req, res) => {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, session: true },
    });
    return res.json({ bookings });
  }
);

app.get(
  "/admin/payments",
  authMiddleware(),
  adminMiddleware(),
  async (_req, res) => {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, booking: true },
    });
    return res.json({ payments });
  }
);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
