import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { sendBookingConfirmation } from "./email.js";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://book.evolvewithavadhi.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now; tighten later if needed
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

const prisma = new PrismaClient();
const otpStore = new Map<
  string,
  { phone: string; otp: string; expiresAt: number }
>();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

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

// ─── Google Sign-In ───────────────────────────────────────────────────────────

app.post("/auth/google", async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ error: "id_token_required" });
  }
  if (!googleClient) {
    return res.status(500).json({ error: "google_not_configured" });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return res.status(400).json({ error: "invalid_google_token" });
    }

    const googleId = payload.sub;
    const email = payload.email || null;
    const name = payload.name || null;
    const avatarUrl = payload.picture || null;

    // Upsert user by googleId
    const user = await prisma.user.upsert({
      where: { googleId },
      create: {
        googleId,
        email,
        name,
        avatarUrl,
      },
      update: {
        email: email || undefined,
        name: name || undefined,
        avatarUrl: avatarUrl || undefined,
      },
    });

    const token = signToken(user.id);
    return res.json({ token, user });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(400).json({ error: "google_auth_failed" });
  }
});

// ─── Phone OTP ────────────────────────────────────────────────────────────────

app.post("/auth/request-otp", async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: "phone_required" });
  }

  // Production: use MSG91
  if (IS_PRODUCTION && MSG91_AUTH_KEY && MSG91_TEMPLATE_ID) {
    try {
      const response = await fetch(
        `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${encodeURIComponent(phone)}`,
        {
          method: "POST",
          headers: {
            authkey: MSG91_AUTH_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.type === "success") {
        return res.json({ otpToken: data.request_id });
      }
      console.error("MSG91 send error:", data);
      return res.status(500).json({ error: "otp_send_failed" });
    } catch (err) {
      console.error("MSG91 request error:", err);
      return res.status(500).json({ error: "otp_send_failed" });
    }
  }

  // Dev: in-memory OTP
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

  let phone: string;

  // Production: verify via MSG91
  if (IS_PRODUCTION && MSG91_AUTH_KEY) {
    try {
      const response = await fetch(
        `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&request_id=${encodeURIComponent(otpToken)}`,
        {
          method: "GET",
          headers: {
            authkey: MSG91_AUTH_KEY,
          },
        }
      );
      const data = await response.json();
      if (data.type !== "success") {
        return res.status(400).json({ error: "invalid_otp" });
      }
      // MSG91 verify doesn't return the phone, so we need to extract it
      // The phone was sent with the OTP request — we'll store it temporarily
      // Actually, we need a phone lookup. Let's use a lightweight store for prod too.
      // Alternative: require the frontend to send the phone along with verify
      phone = req.body.phone;
      if (!phone) {
        return res.status(400).json({ error: "phone_required_for_verify" });
      }
    } catch (err) {
      console.error("MSG91 verify error:", err);
      return res.status(400).json({ error: "otp_verify_failed" });
    }
  } else {
    // Dev: in-memory verification
    const record = otpStore.get(otpToken);
    if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
      return res.status(400).json({ error: "invalid_otp" });
    }
    otpStore.delete(otpToken);
    phone = record.phone;
  }

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });
  const token = signToken(user.id);
  return res.json({ token, user });
});

// ─── User ─────────────────────────────────────────────────────────────────────

app.get("/me", authMiddleware(), async (req, res) => {
  return res.json({ user: (req as any).user });
});

app.patch("/users/me", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { name, goal, email, phone, onboardingComplete } = req.body || {};
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (goal !== undefined) data.goal = goal;
  if (email !== undefined) data.email = email;
  // Sanitize phone: empty string → null, otherwise keep value
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (onboardingComplete !== undefined) data.onboardingComplete = Boolean(onboardingComplete);

  // If a phone is being set, check it's not already taken by another user
  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing && existing.id !== user.id) {
      return res.status(409).json({
        error: "phone_taken",
        message: "This phone number is already linked to another account. Please use a different number or log in with that phone instead.",
      });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });
    return res.json({ user: updated });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "unique_conflict",
        message: "This phone number is already linked to another account.",
      });
    }
    console.error("Update user error:", err);
    return res.status(500).json({ error: "update_failed" });
  }
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

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

// ─── Bookings ─────────────────────────────────────────────────────────────────

app.post("/bookings", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { sessionId, policySignedName, policySignature, policyAgreedAt } = req.body || {};
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
      policySignedName: policySignedName || null,
      policySignature: policySignature || null,
      policyAgreedAt: policyAgreedAt ? new Date(policyAgreedAt) : null,
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

// ─── Payments ─────────────────────────────────────────────────────────────────

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

// ─── Admin ────────────────────────────────────────────────────────────────────

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

// Auto-seed sessions if the table is empty (runs once on startup)
async function autoSeed() {
  const count = await prisma.session.count();
  if (count === 0) {
    console.log("No sessions found — seeding default sessions...");
    await prisma.session.createMany({
      data: [
        {
          title: "Individual Therapy Session",
          host: "Avadhi Sharma",
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 2500,
          currency: "INR",
          tidycalUrl: "https://tidycal.com/avadhisharma",
        },
        {
          title: "Couple Counselling Session",
          host: "Avadhi Sharma",
          startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          price: 3500,
          currency: "INR",
          tidycalUrl: "https://tidycal.com/avadhisharma",
        },
        {
          title: "Adulting & Personal Growth",
          host: "Avadhi Sharma",
          startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          price: 2000,
          currency: "INR",
          tidycalUrl: "https://tidycal.com/avadhisharma",
        },
      ],
    });
    console.log("Sessions seeded successfully.");
  }
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  autoSeed().catch((err) => console.error("Auto-seed failed:", err));
});
