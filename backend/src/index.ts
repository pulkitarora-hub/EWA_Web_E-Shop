import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { sendBookingConfirmation, sendSessionReminder, sendPasswordResetEmail } from "./email.js";
import { OAuth2Client } from "google-auth-library";
import cron from "node-cron";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import validator from "validator";
import bcrypt from "bcryptjs";
import therapistRoutes from "./routes/therapist.js";
import notesRoutes from "./routes/notes.js";
import clientProfileRoutes from "./routes/clientProfile.js";
import adminTherapistRoutes from "./routes/adminTherapist.js";
import zoomRoutes from "./routes/zoom.js";
import { createZoomMeetingForBooking, getZoomConfigStatus } from "./services/zoom.js";
import { syncTidyCalBookings, getTidyCalStatus } from "./services/tidycal.js";

dotenv.config();

const app = express();

// CORS origins - configurable via environment variable
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://book.evolvewithavadhi.com",
    ];

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.razorpay.com", ...ALLOWED_ORIGINS],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://tidycal.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding TidyCal
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Additional security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

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

if (IS_PRODUCTION && JWT_SECRET === "dev-secret") {
  throw new Error("JWT_SECRET must be set to a secure value in production");
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited" },
});

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "24h" });
}

function isValidPhone(phone?: string | null) {
  if (!phone) return false;
  return /^\+?[1-9]\d{7,14}$/.test(phone);
}

function isValidEmail(email?: string | null) {
  if (!email) return false;
  return validator.isEmail(email);
}

function sanitizeText(value?: string | null, maxLength = 1000) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim().slice(0, maxLength);
  return validator.escape(trimmed);
}

function isStrongPassword(password?: string | null) {
  if (!password) return false;
  return password.length >= 8;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
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

app.post("/auth/google", authLimiter, async (req, res) => {
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

// ─── Email/Password Auth ───────────────────────────────────────────────────────

app.post("/auth/signup", authLimiter, async (req, res) => {
  const { email, phone, password, name } = req.body || {};
  if (!email && !phone) {
    return res.status(400).json({ error: "email_or_phone_required" });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid_phone" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "weak_password" });
  }
  if (name && name.length > 100) {
    return res.status(400).json({ error: "name_too_long" });
  }

  const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
  const normalizedPhone = phone ? String(phone).trim() : null;

  if (normalizedEmail) {
    const existing = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "email_taken" });
    }
  }
  if (normalizedPhone) {
    const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existing) {
      return res.status(409).json({ error: "phone_taken" });
    }
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      name: name || null,
      passwordHash,
    },
  });
  const token = signToken(user.id);
  return res.json({ token, user });
});

app.post("/auth/login", authLimiter, async (req, res) => {
  const { email, phone, password } = req.body || {};
  if (!email && !phone) {
    return res.status(400).json({ error: "email_or_phone_required" });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid_phone" });
  }
  if (!password) {
    return res.status(400).json({ error: "password_required" });
  }

  const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
  const normalizedPhone = phone ? String(phone).trim() : null;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        normalizedEmail ? { email: normalizedEmail } : undefined,
        normalizedPhone ? { phone: normalizedPhone } : undefined,
      ].filter(Boolean) as any,
    },
  });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const matches = await bcrypt.compare(String(password), user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = signToken(user.id);
  return res.json({ token, user });
});

app.post("/auth/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });

  if (!user || !user.passwordHash) {
    return res.json({ ok: true });
  }

  if (user.resetTokenSentAt && Date.now() - user.resetTokenSentAt.getTime() < 2 * 60 * 1000) {
    return res.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
      resetTokenSentAt: new Date(),
    },
  });

  await sendPasswordResetEmail(
    { name: user.name, email: user.email },
    token
  );

  return res.json({ ok: true });
});

app.post("/auth/reset-password", authLimiter, async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (!token) {
    return res.status(400).json({ error: "token_required" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "weak_password" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const tokenHash = hashToken(String(token));
  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "invalid_or_expired_token" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      resetTokenSentAt: null,
    },
  });

  return res.json({ ok: true });
});

// ─── Phone OTP ────────────────────────────────────────────────────────────────

app.post("/auth/request-otp", authLimiter, async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: "phone_required" });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid_phone" });
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

app.post("/auth/verify-otp", authLimiter, async (req, res) => {
  const { otpToken, otp } = req.body || {};

  let phone: string;

  // Production: verify via MSG91
  if (!/^\d{6}$/.test(String(otp || ""))) {
    return res.status(400).json({ error: "invalid_otp" });
  }

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
  if (name !== undefined && name && name.length > 100) {
    return res.status(400).json({ error: "name_too_long" });
  }
  if (goal !== undefined && goal && goal.length > 500) {
    return res.status(400).json({ error: "goal_too_long" });
  }
  if (email !== undefined && email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (name !== undefined) data.name = name;
  if (goal !== undefined) data.goal = goal;
  if (email !== undefined) data.email = email;
  // Sanitize phone: empty string → null, otherwise keep value
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (data.phone && !isValidPhone(data.phone)) {
    return res.status(400).json({ error: "invalid_phone" });
  }
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

// ─── Referral Code ───────────────────────────────────────────────────────────

function generateReferralCode(name?: string | null): string {
  const prefix = (name || "EWA")
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

app.get("/my-referral-code", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  if (user.referralCode) {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: { referee: { select: { name: true, createdAt: true } } },
    });
    return res.json({ referralCode: user.referralCode, referrals });
  }
  // Generate one
  let code = generateReferralCode(user.name);
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) break;
    code = generateReferralCode(user.name);
    attempts++;
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { referralCode: code },
  });
  return res.json({ referralCode: updated.referralCode, referrals: [] });
});

app.post("/referral/apply", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "code_required" });

  if (user.referredByCode) {
    return res.status(400).json({ error: "already_referred", message: "You have already applied a referral code." });
  }

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) {
    return res.status(404).json({ error: "invalid_code", message: "Referral code not found." });
  }
  if (referrer.id === user.id) {
    return res.status(400).json({ error: "self_referral", message: "You cannot use your own referral code." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { referredByCode: code },
  });

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      refereeId: user.id,
      status: "completed",
      discountPct: 10,
    },
  });

  return res.json({ message: "Referral code applied! You and your referrer each get 10% off your next booking." });
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
  const {
    sessionId,
    promoCode,
    useCredit,
    policySignedName,
    policySignature,
    policyAgreedAt,
  } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: "session_required" });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return res.status(404).json({ error: "session_not_found" });
  }

  // Policy: use body if provided, else use user's stored policy if they've signed before
  const hasPolicyInBody = !!(policySignedName && policyAgreedAt);
  const useStoredPolicy = !hasPolicyInBody && user.policySignedAt;
  if (!hasPolicyInBody && !useStoredPolicy) {
    return res.status(400).json({
      error: "policy_required",
      message: "Please agree to the policy to continue.",
    });
  }
  const bookingPolicy = hasPolicyInBody
    ? {
        policySignedName: policySignedName || null,
        policySignature: policySignature || null,
        policyAgreedAt: policyAgreedAt ? new Date(policyAgreedAt) : null,
      }
    : {
        policySignedName: (user as any).policySignedName || user.name || null,
        policySignature: null,
        policyAgreedAt: (user as any).policySignedAt,
      };

  let finalAmount = session.price;
  let promoCodeId: string | null = null;
  let promoDiscount = 0;
  let referralDiscount = 0;

  // ── Apply promo code ──
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
    if (!promo || !promo.active) {
      return res.status(400).json({ error: "invalid_promo", message: "Promo code is invalid or inactive." });
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ error: "promo_expired", message: "This promo code has expired." });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ error: "promo_limit", message: "This promo code has reached its usage limit." });
    }
    if (promo.minAmount && session.price < promo.minAmount) {
      return res.status(400).json({ error: "promo_min_amount", message: `Minimum amount for this code is ${promo.minAmount}.` });
    }
    // Check if user already used this promo
    const used = await prisma.promoUsage.findFirst({ where: { promoCodeId: promo.id, userId: user.id } });
    if (used) {
      return res.status(400).json({ error: "promo_already_used", message: "You have already used this promo code." });
    }

    promoCodeId = promo.id;
    promoDiscount =
      promo.type === "percentage"
        ? Math.round((session.price * promo.value) / 100)
        : promo.value;
    promoDiscount = Math.min(promoDiscount, finalAmount);
    finalAmount -= promoDiscount;
  }

  // ── Apply referral discount ──
  if (!promoCode && user.referredByCode) {
    const referral = await prisma.referral.findFirst({
      where: { refereeId: user.id, refereeUsed: false },
    });
    if (referral) {
      referralDiscount = Math.round((finalAmount * referral.discountPct) / 100);
      finalAmount -= referralDiscount;
      await prisma.referral.update({
        where: { id: referral.id },
        data: { refereeUsed: true },
      });
      // Also give the referrer their discount
      const referrerReferral = await prisma.referral.findFirst({
        where: { referrerId: referral.referrerId, refereeId: user.id, referrerUsed: false },
      });
      if (referrerReferral) {
        await prisma.referral.update({
          where: { id: referrerReferral.id },
          data: { referrerUsed: false }, // keep available for referrer's next booking
        });
      }
    }
  }

  finalAmount = Math.max(finalAmount, 0);

  // ── Credit-based booking ──
  if (useCredit) {
    // Find an active package with remaining credits
    const allActive = await prisma.userPackage.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { createdAt: "asc" },
    });
    const pkg = allActive.find((p) => p.creditsUsed < p.creditsTotal) || null;
    if (!pkg) {
      return res.status(400).json({ error: "no_credits", message: "You have no session credits remaining." });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        status: "paid",
        amount: 0,
        currency: session.currency,
        usedCredit: true,
        paidAt: new Date(),
        policySignedName: bookingPolicy.policySignedName,
        policySignature: bookingPolicy.policySignature,
        policyAgreedAt: bookingPolicy.policyAgreedAt,
      },
    });

    if (hasPolicyInBody && !(user as any).policySignedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          policySignedAt: bookingPolicy.policyAgreedAt || new Date(),
          policySignedName: bookingPolicy.policySignedName,
        },
      });
    }

    await prisma.creditUsage.create({
      data: { userPackageId: pkg.id, bookingId: booking.id },
    });

    const newUsed = pkg.creditsUsed + 1;
    await prisma.userPackage.update({
      where: { id: pkg.id },
      data: {
        creditsUsed: newUsed,
        status: newUsed >= pkg.creditsTotal ? "exhausted" : "active",
      },
    });

    // Send confirmation email
    sendBookingConfirmation(user, session, booking).catch((err) =>
      console.error("Email send failed:", err)
    );

    return res.json({
      bookingId: booking.id,
      usedCredit: true,
      amount: 0,
      currency: session.currency,
    });
  }

  // ── Normal Razorpay booking ──
  if (!razorpay) {
    return res.status(400).json({ error: "razorpay_not_configured" });
  }

  const order = await razorpay.orders.create({
    amount: finalAmount * 100,
    currency: session.currency,
    receipt: `booking_${Date.now()}`,
    notes: { sessionId, userId: user.id },
  });

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      status: "pending",
      amount: finalAmount,
      currency: session.currency,
      razorpayOrderId: order.id,
      promoCodeId,
      promoDiscount,
      referralDiscount,
      policySignedName: bookingPolicy.policySignedName,
      policySignature: bookingPolicy.policySignature,
      policyAgreedAt: bookingPolicy.policyAgreedAt,
    },
  });

  if (hasPolicyInBody && !(user as any).policySignedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        policySignedAt: bookingPolicy.policyAgreedAt || new Date(),
        policySignedName: bookingPolicy.policySignedName,
      },
    });
  }

  // Track promo usage
  if (promoCodeId) {
    await prisma.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
    await prisma.promoUsage.create({
      data: { promoCodeId, userId: user.id, bookingId: booking.id, discount: promoDiscount },
    });
  }

  return res.json({
    bookingId: booking.id,
    orderId: order.id,
    amount: finalAmount,
    originalAmount: session.price,
    promoDiscount,
    referralDiscount,
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
  if (booking.status === "paid") {
    return res.status(400).json({ error: "already_paid" });
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

  // NOTE: Zoom meeting creation disabled - TidyCal handles meeting creation
  // The meeting URL will be synced from TidyCal via the syncTidyCalBookings cron job
  // To re-enable our own Zoom integration, uncomment the code below:
  /*
  let zoomMeeting = null;
  try {
    const zoomStatus = await getZoomConfigStatus();
    if (zoomStatus.configured) {
      zoomMeeting = await createZoomMeetingForBooking(bookingId);
      console.log("Zoom meeting created:", zoomMeeting.zoomMeetingId);
    }
  } catch (err) {
    console.error("Failed to create Zoom meeting:", err);
  }
  */

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

// ─── My Bookings ─────────────────────────────────────────────────────────────

app.get("/my-bookings", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      session: true,
      review: true,
    },
  });
  return res.json({ bookings });
});

// ─── Cancel Booking ──────────────────────────────────────────────────────────

app.post("/bookings/:id/cancel", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { reason } = req.body || {};

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { session: true },
  });

  if (!booking || booking.userId !== user.id) {
    return res.status(404).json({ error: "booking_not_found" });
  }

  if (booking.status === "cancelled") {
    return res.status(400).json({ error: "already_cancelled" });
  }

  if (booking.status !== "paid") {
    return res.status(400).json({ error: "only_paid_bookings_can_be_cancelled" });
  }

  // Check 24h window
  const sessionTime = new Date(booking.session.startTime).getTime();
  const now = Date.now();
  const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60);

  if (hoursUntilSession < 24) {
    return res.status(400).json({
      error: "cancellation_window_closed",
      message: "Bookings can only be cancelled at least 24 hours before the session.",
    });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || null,
    },
    include: { session: true },
  });

  return res.json({ booking: updated });
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

app.post("/bookings/:id/review", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { rating, comment } = req.body || {};
  const ratingValue = Number(rating);

  if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return res.status(400).json({ error: "rating_required", message: "Rating must be 1-5." });
  }
  const sanitizedComment = sanitizeText(comment, 1000);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { session: true, review: true },
  });

  if (!booking || booking.userId !== user.id) {
    return res.status(404).json({ error: "booking_not_found" });
  }

  if (booking.status !== "paid") {
    return res.status(400).json({ error: "booking_not_paid" });
  }

  // Session must be in the past
  const sessionTime = new Date(booking.session.startTime).getTime();
  if (sessionTime > Date.now()) {
    return res.status(400).json({
      error: "session_not_completed",
      message: "You can only review after the session has taken place.",
    });
  }

  if (booking.review) {
    return res.status(400).json({ error: "already_reviewed" });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      userId: user.id,
      sessionId: booking.sessionId,
      rating: ratingValue,
      comment: sanitizedComment,
    },
  });

  return res.json({ review });
});

// Public: get reviews for a session
app.get("/sessions/:id/reviews", async (req, res) => {
  const { id } = req.params;
  const reviews = await prisma.review.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  return res.json({ reviews, averageRating: Math.round(avg * 10) / 10, count: reviews.length });
});

// ─── Packages ────────────────────────────────────────────────────────────────

app.get("/packages", async (_req, res) => {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { sessionCount: "asc" },
  });
  return res.json({ packages });
});

app.post("/packages", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { name, sessionCount, price, currency, description } = req.body || {};
  if (!name || !sessionCount || !price) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const pkg = await prisma.package.create({
    data: { name, sessionCount, price, currency: currency || "INR", description },
  });
  return res.json({ package: pkg });
});

app.post("/packages/:id/purchase", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg || !pkg.active) {
    return res.status(404).json({ error: "package_not_found" });
  }
  if (!razorpay) {
    return res.status(400).json({ error: "razorpay_not_configured" });
  }

  const order = await razorpay.orders.create({
    amount: pkg.price * 100,
    currency: pkg.currency,
    receipt: `pkg_${Date.now()}`,
    notes: { packageId: id, userId: user.id },
  });

  const userPkg = await prisma.userPackage.create({
    data: {
      userId: user.id,
      packageId: pkg.id,
      creditsTotal: pkg.sessionCount,
      razorpayOrderId: order.id,
      status: "pending",
    },
  });

  return res.json({
    userPackageId: userPkg.id,
    orderId: order.id,
    amount: pkg.price,
    currency: pkg.currency,
    razorpayKeyId: RAZORPAY_KEY_ID,
  });
});

app.post("/packages/verify-payment", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { userPackageId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

  if (!userPackageId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const userPkg = await prisma.userPackage.findUnique({ where: { id: userPackageId } });
  if (!userPkg || userPkg.userId !== user.id) {
    return res.status(404).json({ error: "package_not_found" });
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
  if (expected !== razorpaySignature) {
    return res.status(400).json({ error: "invalid_signature" });
  }

  const updated = await prisma.userPackage.update({
    where: { id: userPackageId },
    data: { status: "active", paidAt: new Date() },
    include: { package: true },
  });

  return res.json({ userPackage: updated });
});

app.get("/my-packages", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const packages = await prisma.userPackage.findMany({
    where: { userId: user.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });
  const totalCredits = packages
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.creditsTotal - p.creditsUsed), 0);
  return res.json({ packages, totalCredits });
});

// ─── Promo Codes ─────────────────────────────────────────────────────────────

app.post("/promo-codes/validate", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { code, amount } = req.body || {};

  if (!code) return res.status(400).json({ error: "code_required" });

  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!promo || !promo.active) {
    return res.status(404).json({ error: "invalid_code", message: "Invalid promo code." });
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return res.status(400).json({ error: "expired", message: "This promo code has expired." });
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ error: "limit_reached", message: "This promo code has reached its limit." });
  }
  if (promo.minAmount && amount && amount < promo.minAmount) {
    return res.status(400).json({ error: "min_amount", message: `Minimum amount required: INR ${promo.minAmount}` });
  }
  const used = await prisma.promoUsage.findFirst({ where: { promoCodeId: promo.id, userId: user.id } });
  if (used) {
    return res.status(400).json({ error: "already_used", message: "You have already used this promo code." });
  }

  const discount =
    promo.type === "percentage"
      ? Math.round(((amount || 0) * promo.value) / 100)
      : promo.value;

  return res.json({
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discount: Math.min(discount, amount || discount),
    description: promo.type === "percentage" ? `${promo.value}% off` : `INR ${promo.value} off`,
  });
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

app.post("/subscriptions", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { sessionTitle, frequency, price } = req.body || {};

  if (!sessionTitle || !frequency || !price) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (!["weekly", "biweekly"].includes(frequency)) {
    return res.status(400).json({ error: "invalid_frequency", message: "Frequency must be 'weekly' or 'biweekly'." });
  }

  const daysUntilNext = frequency === "weekly" ? 7 : 14;
  const nextBillingAt = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      sessionTitle,
      frequency,
      price,
      currency: "INR",
      status: "active",
      nextBillingAt,
    },
  });

  return res.json({ subscription });
});

app.get("/my-subscriptions", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ subscriptions });
});

app.post("/subscriptions/:id/cancel", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== user.id) {
    return res.status(404).json({ error: "subscription_not_found" });
  }
  if (sub.status === "cancelled") {
    return res.status(400).json({ error: "already_cancelled" });
  }
  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: "cancelled" },
  });
  return res.json({ subscription: updated });
});

app.post("/subscriptions/:id/pause", authMiddleware(), async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub || sub.userId !== user.id) {
    return res.status(404).json({ error: "subscription_not_found" });
  }
  const newStatus = sub.status === "paused" ? "active" : "paused";
  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: newStatus },
  });
  return res.json({ subscription: updated });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string | null,
  metadata?: Record<string, any>
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId,
        targetUserId: targetUserId || null,
        action,
        metadata: metadata ? metadata : undefined,
      },
    });
  } catch (err) {
    console.error("Admin audit log error:", err);
  }
}

app.get("/admin/users", authMiddleware(), adminMiddleware(), async (req, res) => {
  const {
    search,
    isAdmin,
    onboardingComplete,
    page = "1",
    pageSize = "25",
    sortBy = "createdAt",
    sortDir = "desc",
    startDate,
    endDate,
  } = req.query || {};
  const where: any = {};

  if (typeof search === "string" && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { referralCode: { contains: term, mode: "insensitive" } },
      { googleId: { contains: term, mode: "insensitive" } },
    ];
  }

  if (typeof isAdmin === "string") {
    where.isAdmin = isAdmin === "true";
  }

  if (typeof onboardingComplete === "string") {
    where.onboardingComplete = onboardingComplete === "true";
  }

  const createdAt: any = {};
  if (typeof startDate === "string" && startDate) {
    const parsed = new Date(startDate);
    if (!Number.isNaN(parsed.getTime())) createdAt.gte = parsed;
  }
  if (typeof endDate === "string" && endDate) {
    const parsed = new Date(endDate);
    if (!Number.isNaN(parsed.getTime())) createdAt.lte = parsed;
  }
  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(pageSize) || 25));
  const skip = (pageNum - 1) * perPage;
  const orderField = sortBy === "name" ? "name" : "createdAt";
  const orderDirection = sortDir === "asc" ? "asc" : "desc";

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [orderField]: orderDirection },
      skip,
      take: perPage,
    }),
  ]);

  return res.json({ users, page: pageNum, pageSize: perPage, total });
});

app.patch("/admin/users/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const adminUser = (req as any).user;
  const { id } = req.params;
  const { name, goal, email, phone, onboardingComplete, isAdmin } = req.body || {};
  const data: any = {};

  if (name !== undefined && name && name.length > 100) {
    return res.status(400).json({ error: "name_too_long" });
  }
  if (goal !== undefined && goal && goal.length > 500) {
    return res.status(400).json({ error: "goal_too_long" });
  }
  if (email !== undefined && email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }

  if (name !== undefined) data.name = name;
  if (goal !== undefined) data.goal = goal;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (data.phone && !isValidPhone(data.phone)) {
    return res.status(400).json({ error: "invalid_phone" });
  }
  if (onboardingComplete !== undefined) data.onboardingComplete = Boolean(onboardingComplete);
  if (isAdmin !== undefined) data.isAdmin = Boolean(isAdmin);

  if (adminUser.id === id && data.isAdmin === false) {
    return res.status(400).json({ error: "cannot_remove_own_admin" });
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ error: "user_not_found" });
  }

  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing && existing.id !== id) {
      return res.status(409).json({
        error: "phone_taken",
        message: "This phone number is already linked to another account.",
      });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    const changes: Record<string, { from: any; to: any }> = {};
    Object.keys(data).forEach((key) => {
      const prev = (existingUser as any)[key];
      const next = (updated as any)[key];
      if (prev !== next) changes[key] = { from: prev, to: next };
    });

    if (Object.keys(changes).length > 0) {
      await logAdminAction(adminUser.id, "user_update", updated.id, { changes });
    }

    return res.json({ user: updated });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "unique_conflict",
        message: "This phone number is already linked to another account.",
      });
    }
    console.error("Admin update user error:", err);
    return res.status(500).json({ error: "update_failed" });
  }
});

app.get("/admin/users/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "user_not_found" });
  }

  const [bookings, payments, userPackages, subscriptions, referralsMade, referralsReceived, auditLogs] =
    await Promise.all([
      prisma.booking.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: { session: true },
        take: 10,
      }),
      prisma.payment.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.userPackage.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: { package: true },
        take: 10,
      }),
      prisma.subscription.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.referral.findMany({
        where: { referrerId: id },
        orderBy: { createdAt: "desc" },
        include: { referee: true },
        take: 10,
      }),
      prisma.referral.findMany({
        where: { refereeId: id },
        orderBy: { createdAt: "desc" },
        include: { referrer: true },
        take: 10,
      }),
      prisma.adminAuditLog.findMany({
        where: { targetUserId: id },
        orderBy: { createdAt: "desc" },
        include: { adminUser: true },
        take: 20,
      }),
    ]);

  return res.json({
    user,
    bookings,
    payments,
    userPackages,
    subscriptions,
    referralsMade,
    referralsReceived,
    auditLogs,
  });
});

app.post("/admin/users/bulk", authMiddleware(), adminMiddleware(), async (req, res) => {
  const adminUser = (req as any).user;
  const { ids, action } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "missing_ids" });
  }

  const normalizedIds = Array.from(new Set(ids.filter((id) => typeof id === "string")));
  if (normalizedIds.length === 0) {
    return res.status(400).json({ error: "invalid_ids" });
  }

  const actionMap: Record<string, any> = {
    set_admin: { isAdmin: true },
    remove_admin: { isAdmin: false },
    mark_onboarded: { onboardingComplete: true },
    mark_not_onboarded: { onboardingComplete: false },
  };

  const updateData = actionMap[action];
  if (!updateData) {
    return res.status(400).json({ error: "invalid_action" });
  }

  if (action === "remove_admin" && normalizedIds.includes(adminUser.id)) {
    return res.status(400).json({ error: "cannot_remove_own_admin" });
  }

  const now = new Date();
  const logs = normalizedIds.map((targetId) => ({
    adminUserId: adminUser.id,
    targetUserId: targetId,
    action: "user_bulk_update",
    metadata: { action, updateData },
    createdAt: now,
  }));

  const [result] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: normalizedIds } },
      data: updateData,
    }),
    prisma.adminAuditLog.createMany({ data: logs }),
  ]);

  return res.json({ updatedCount: result.count });
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

app.get("/admin/reviews", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { search, rating } = req.query || {};
  const where: any = {};

  if (typeof rating === "string" && rating.trim()) {
    const parsed = Number(rating);
    if (!Number.isNaN(parsed)) {
      where.rating = parsed;
    }
  }

  if (typeof search === "string" && search.trim()) {
    const term = search.trim();
    where.OR = [
      { comment: { contains: term, mode: "insensitive" } },
      { session: { title: { contains: term, mode: "insensitive" } } },
      { user: { name: { contains: term, mode: "insensitive" } } },
      { user: { email: { contains: term, mode: "insensitive" } } },
      { user: { phone: { contains: term, mode: "insensitive" } } },
    ];
  }

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: true, session: true, booking: true },
  });

  return res.json({ reviews });
});

// ─── Admin Promo Codes ───────────────────────────────────────────────────────

app.get("/admin/promo-codes", authMiddleware(), adminMiddleware(), async (_req, res) => {
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ promoCodes: codes });
});

app.post("/admin/promo-codes", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { code, type, value, maxUses, minAmount, expiresAt } = req.body || {};
  if (!code || !type || !value) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (!["percentage", "flat"].includes(type)) {
    return res.status(400).json({ error: "invalid_type", message: "Type must be 'percentage' or 'flat'." });
  }

  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        maxUses: maxUses ? Number(maxUses) : null,
        minAmount: minAmount ? Number(minAmount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return res.json({ promoCode: promo });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "code_exists", message: "This promo code already exists." });
    }
    throw err;
  }
});

app.patch("/admin/promo-codes/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  const { active } = req.body || {};
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { active: Boolean(active) },
  });
  return res.json({ promoCode: updated });
});

app.delete("/admin/promo-codes/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  await prisma.promoCode.delete({ where: { id } });
  return res.json({ ok: true });
});

// ─── Admin Packages ──────────────────────────────────────────────────────────

app.get("/admin/packages", authMiddleware(), adminMiddleware(), async (_req, res) => {
  const packages = await prisma.package.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ packages });
});

app.patch("/admin/packages/:id", authMiddleware(), adminMiddleware(), async (req, res) => {
  const { id } = req.params;
  const { active } = req.body || {};
  const updated = await prisma.package.update({
    where: { id },
    data: { active: Boolean(active) },
  });
  return res.json({ package: updated });
});

// ─── Admin Subscriptions ─────────────────────────────────────────────────────

app.get("/admin/subscriptions", authMiddleware(), adminMiddleware(), async (_req, res) => {
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true, email: true } } },
  });
  return res.json({ subscriptions: subs });
});

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

// ─── Session Reminders (cron) ────────────────────────────────────────────────

async function sendReminders() {
  const now = Date.now();
  const in1h = new Date(now + 1 * 60 * 60 * 1000);
  const in25h = new Date(now + 25 * 60 * 60 * 1000);

  // Find paid bookings with sessions in the next 25 hours that haven't been reminded yet
  const bookings = await prisma.booking.findMany({
    where: {
      status: "paid",
      session: {
        startTime: { lte: in25h, gt: new Date() },
      },
      OR: [{ reminder24hSent: false }, { reminder1hSent: false }],
    },
    include: {
      session: true,
      user: true,
    },
  });

  for (const booking of bookings) {
    const sessionTime = new Date(booking.session.startTime).getTime();
    const hoursUntil = (sessionTime - now) / (1000 * 60 * 60);

    // 24h reminder: send when session is between 23-25 hours away
    if (!booking.reminder24hSent && hoursUntil <= 25 && hoursUntil > 1.5) {
      try {
        await sendSessionReminder(booking.user, booking.session, 24);
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder24hSent: true },
        });
        console.log(`24h reminder sent for booking ${booking.id}`);
      } catch (err) {
        console.error(`24h reminder failed for booking ${booking.id}:`, err);
      }
    }

    // 1h reminder: send when session is within 1.5 hours
    if (!booking.reminder1hSent && hoursUntil <= 1.5) {
      try {
        await sendSessionReminder(booking.user, booking.session, 1);
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder1hSent: true },
        });
        console.log(`1h reminder sent for booking ${booking.id}`);
      } catch (err) {
        console.error(`1h reminder failed for booking ${booking.id}:`, err);
      }
    }
  }
}

// ─── Subscription billing cron ───────────────────────────────────────────────

async function processSubscriptions() {
  const now = new Date();
  const dueSubs = await prisma.subscription.findMany({
    where: {
      status: "active",
      nextBillingAt: { lte: now },
    },
    include: { user: true },
  });

  for (const sub of dueSubs) {
    try {
      // Find or create a session for this subscription
      let session = await prisma.session.findFirst({
        where: {
          title: sub.sessionTitle,
          startTime: { gt: now },
        },
        orderBy: { startTime: "asc" },
      });

      if (!session) {
        // Create a future session
        const daysAhead = sub.frequency === "weekly" ? 7 : 14;
        session = await prisma.session.create({
          data: {
            title: sub.sessionTitle,
            host: "Avadhi Sharma",
            startTime: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
            price: sub.price,
            currency: sub.currency,
            tidycalUrl: "https://tidycal.com/avadhisharma",
          },
        });
      }

      // Check if user has credits
      const allActive = await prisma.userPackage.findMany({
        where: { userId: sub.userId, status: "active" },
        orderBy: { createdAt: "asc" },
      });
      const pkg = allActive.find((p) => p.creditsUsed < p.creditsTotal) || null;

      if (pkg) {
        // Use credit
        const booking = await prisma.booking.create({
          data: {
            userId: sub.userId,
            sessionId: session.id,
            status: "paid",
            amount: 0,
            currency: sub.currency,
            usedCredit: true,
            paidAt: new Date(),
          },
        });
        await prisma.creditUsage.create({ data: { userPackageId: pkg.id, bookingId: booking.id } });
        const newUsed = pkg.creditsUsed + 1;
        await prisma.userPackage.update({
          where: { id: pkg.id },
          data: { creditsUsed: newUsed, status: newUsed >= pkg.creditsTotal ? "exhausted" : "active" },
        });
        console.log(`Subscription ${sub.id}: auto-booked with credit for ${sub.sessionTitle}`);
      } else {
        // Create pending booking (user needs to pay)
        await prisma.booking.create({
          data: {
            userId: sub.userId,
            sessionId: session.id,
            status: "pending_payment",
            amount: sub.price,
            currency: sub.currency,
          },
        });
        console.log(`Subscription ${sub.id}: created pending booking for ${sub.sessionTitle}`);
      }

      // Advance next billing date
      const daysUntilNext = sub.frequency === "weekly" ? 7 : 14;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextBillingAt: new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000) },
      });
    } catch (err) {
      console.error(`Subscription ${sub.id} processing failed:`, err);
    }
  }
}

// Run reminder check every 10 minutes
cron.schedule("*/10 * * * *", () => {
  console.log("Running session reminder check...");
  sendReminders().catch((err) => console.error("Reminder cron error:", err));
});

// Run subscription processing daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("Processing subscriptions...");
  processSubscriptions().catch((err) => console.error("Subscription cron error:", err));
});


// ─── Mount new route modules ──────────────────────────────────────────────────
app.use(therapistRoutes);
app.use(notesRoutes);
app.use(clientProfileRoutes);
app.use(adminTherapistRoutes);
app.use(zoomRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  autoSeed().catch((err) => console.error("Auto-seed failed:", err));
  // Run reminders once on startup as well
  sendReminders().catch((err) => console.error("Initial reminder check failed:", err));
});

// ─── Admin Seed Endpoint (protected) ─────────────────────────────────────────
app.post("/admin/seed-sessions", async (req, res) => {
  const { secret } = req.body || {};
  const SEED_SECRET = process.env.SEED_SECRET || "temp-seed-secret-2024";
  
  if (secret !== SEED_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    // TidyCal URL mappings
    const TIDYCAL_URLS = {
      online45: "https://tidycal.com/avadhisharma/individual-therapy-45-minutes-online",
      online60: "https://tidycal.com/avadhisharma/ic-off-ses-1hr",
      online75: "https://tidycal.com/avadhisharma/ic-off-ses-1hr",
      online90: "https://tidycal.com/avadhisharma/ic-off-ses-1hr",
    };

    // Sessions to create/update based on policy sheet
    const sessionsData = [
      // Standalone Clarity Sessions
      { title: "Standalone Clarity Session - 45 min", host: "Avadhi Sharma", price: 3500, currency: "INR", tidycalUrl: TIDYCAL_URLS.online45 },
      { title: "Standalone Clarity Session - 60 min", host: "Avadhi Sharma", price: 4000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online60 },
      { title: "Standalone Clarity Session - 75 min", host: "Avadhi Sharma", price: 4500, currency: "INR", tidycalUrl: TIDYCAL_URLS.online75 },
      { title: "Standalone Clarity Session - 90 min", host: "Avadhi Sharma", price: 5000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online90 },
      // Steady Inner Balance (4 sessions/month)
      { title: "Steady Inner Balance - 45 min", host: "Avadhi Sharma", price: 12000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online45 },
      { title: "Steady Inner Balance - 60 min", host: "Avadhi Sharma", price: 14000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online60 },
      { title: "Steady Inner Balance - 75 min", host: "Avadhi Sharma", price: 16000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online75 },
      { title: "Steady Inner Balance - 90 min", host: "Avadhi Sharma", price: 18000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online90 },
      // Deep Work Subscription (8 sessions/month)
      { title: "Deep Work Subscription - 45 min", host: "Avadhi Sharma", price: 20000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online45 },
      { title: "Deep Work Subscription - 60 min", host: "Avadhi Sharma", price: 24000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online60 },
      { title: "Deep Work Subscription - 75 min", host: "Avadhi Sharma", price: 28000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online75 },
      { title: "Deep Work Subscription - 90 min", host: "Avadhi Sharma", price: 32000, currency: "INR", tidycalUrl: TIDYCAL_URLS.online90 },
    ];

    const results = [];
    for (const sessionData of sessionsData) {
      const existing = await prisma.session.findFirst({ where: { title: sessionData.title } });
      if (existing) {
        await prisma.session.update({
          where: { id: existing.id },
          data: sessionData,
        });
        results.push({ title: sessionData.title, action: "updated" });
      } else {
        await prisma.session.create({
          data: { ...sessionData, startTime: new Date() },
        });
        results.push({ title: sessionData.title, action: "created" });
      }
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error("Seed error:", error);
    res.status(500).json({ error: error.message });
  }
});
