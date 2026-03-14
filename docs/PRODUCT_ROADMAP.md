# Evolve with Avadhi — Product Roadmap & Feature Tracker

**Last Updated:** February 2026
**Version:** 2.1
**Platform:** Web (PWA) + Backend API

---

## Table of Contents

1. [Current State Summary](#current-state-summary)
2. [Built Features (v2.0)](#built-features-v20)
3. [Partial Features (Need Completion)](#partial-features-need-completion)
4. [Remaining Features (Not Built)](#remaining-features-not-built)
5. [Implementation Guide](#implementation-guide)
6. [Architecture Reference](#architecture-reference)
7. [File Map](#file-map)

---

## Current State Summary

| Category | Built | Partial | Not Built |
|----------|:-----:|:-------:|:---------:|
| Authentication & Onboarding | 5 | 0 | 0 |
| Role-Based Dashboards | 3 | 0 | 0 |
| Session Booking & Payments | 6 | 2 | 0 |
| Therapy Notes & Documentation | 4 | 2 | 0 |
| Integrations (Zoom, TidyCal, etc.) | 5 | 1 | 0 |
| Admin Tools | 6 | 1 | 1 |
| Security & Infrastructure | 6 | 0 | 0 |
| PWA & Mobile | 1 | 0 | 1 |
| Future Roadmap | 0 | 0 | 10 |
| **Totals** | **36** | **6** | **12** |

---

## Built Features (v2.0)

These features are fully implemented and deployed.

### Authentication & Onboarding

| Feature | Backend | Frontend | Key Files |
|---------|---------|----------|-----------|
| Email + Password signup/login | `POST /auth/signup`, `POST /auth/login` | `otp.tsx` | `backend/src/index.ts` |
| Google OAuth | `POST /auth/google` | `GoogleOAuthWrapper` | `backend/src/index.ts`, `web/src/features/auth/otp.tsx` |
| Phone OTP (MSG91) | `POST /request-otp`, `POST /verify-otp` | OTP form | `backend/src/index.ts` |
| Password Reset | `POST /forgot-password`, `POST /reset-password` | Reset flow | `backend/src/index.ts`, `backend/src/email.ts` |
| Policy Agreement | Signature capture, `policySignedAt` tracking | `PolicyModal` | `web/src/features/sessions/PolicyModal.tsx` |

### Role-Based Dashboards

| Dashboard | Route | Key Features | File |
|-----------|-------|-------------|------|
| **Client** | Default for `CLIENT` role | Upcoming sessions, credits, journey timeline, Zoom links | `web/src/features/client/ClientDashboard.tsx` |
| **Therapist** | Default for `THERAPIST` role | Today's sessions, client list, pending notes, stats | `web/src/features/therapist/TherapistDashboard.tsx` |
| **Admin** | Default for `ADMIN` role | Overview, users, bookings, therapists, promos, analytics, zoom | `web/src/features/admin/AdminDashboard.tsx` |

### Session Booking & Payments

| Feature | Details | Key Files |
|---------|---------|-----------|
| Session browsing | Tabbed UI: Single Sessions + Monthly Packages | `web/src/features/sessions/SessionList.tsx` |
| TidyCal booking | Pre-fills name/email, opens TidyCal calendar | `web/src/features/sessions/SessionDetail.tsx` |
| Razorpay checkout | Full payment flow with signature verification | `backend/src/index.ts` (verify-payment) |
| Packages & credits | Purchase bundles, track remaining credits | `web/src/features/packages/PackagesPage.tsx`, `web/src/features/bookings/MyPackages.tsx` |
| Subscriptions | Monthly recurring with auto-billing cron | `backend/src/index.ts` (processSubscriptions) |
| In-person toggle | +₹500 add-on for standalone sessions | `web/src/features/sessions/SessionList.tsx` |
| Promo codes | Percentage/flat discounts, usage limits, expiry | `backend/src/index.ts`, `AdminDashboard.tsx` |
| Referral program | Referral codes, credit tracking | `web/src/features/referral/ReferralSection.tsx` |
| Session reviews | Star rating + comments | `web/src/features/sessions/SessionReviews.tsx` |

### Therapy Notes & Documentation

| Feature | Details | Key Files |
|---------|---------|-----------|
| Note creation | Section-based editor (observations, interventions, homework, private) | `web/src/features/therapist/NoteEditor.tsx` |
| AES-256-GCM encryption | All note content encrypted at rest | `backend/src/services/encryption.ts` |
| Visibility controls | PRIVATE, SHARED, HOMEWORK levels | `backend/src/routes/notes.ts` |
| Client therapy timeline | Session history with shared notes | `web/src/features/therapist/MyTherapyTimeline.tsx` |

### Integrations

| Integration | Purpose | Key Files |
|-------------|---------|-----------|
| **TidyCal** | Appointment scheduling, 5-min sync polling | `backend/src/services/tidycal.ts` |
| **Zoom** | Server-to-Server OAuth, config management, webhooks | `backend/src/services/zoom.ts`, `backend/src/routes/zoom.ts` |
| **Razorpay** | Payment processing, signature verification | `backend/src/index.ts` |
| **MSG91** | Phone OTP delivery | `backend/src/index.ts` |
| **Resend** | Transactional emails (confirmations, reminders, reset) | `backend/src/email.ts` |

### Admin Tools

| Feature | Details | Key Files |
|---------|---------|-----------|
| User management | List, search, view detail, bulk update | `backend/src/index.ts` (/admin/users) |
| Therapist management | Create accounts, view stats, toggle active | `backend/src/routes/adminTherapist.ts` |
| Analytics dashboard | Bookings, revenue, completion rates, active clients | `backend/src/routes/adminTherapist.ts` (/admin/analytics) |
| Promo code management | CRUD with usage tracking | `backend/src/index.ts` |
| Audit logging | All admin actions tracked | `AdminAuditLog` model |
| Zoom configuration | Save/test credentials from UI | `AdminDashboard.tsx` (Zoom tab) |

### Security & Infrastructure

| Feature | Details | Key Files |
|---------|---------|-----------|
| JWT auth with HS256 pinning | Secure token signing/verification | `backend/src/middleware/auth.ts` |
| Rate limiting | Global + per-endpoint limits | `backend/src/index.ts` |
| Security headers | Helmet + custom headers in Next.js | `backend/src/index.ts`, `web/next.config.mjs` |
| Input validation | `validator` library for sanitization | `backend/src/index.ts` |
| Encrypted credentials | Zoom secrets encrypted at rest | `backend/src/services/encryption.ts` |
| Cron jobs | Session reminders (10min), subscription billing (daily), TidyCal sync (5min) | `backend/src/index.ts` |

### PWA

| Feature | Details | Key Files |
|---------|---------|-----------|
| Install prompt | Persistent banner, iOS Safari instructions, session-based dismissal | `web/src/components/PWAInstallPrompt.tsx` |
| Manifest + icons | Full icon set, app metadata | `web/public/manifest.json`, `web/public/icons/` |

---

## Partial Features (Need Completion)

These features have backend/DB support but need additional work.

### 1. Zoom Recordings & Transcripts

**What exists:**
- `ZoomRecording` model in Prisma schema
- `downloadRecording()` and `getTranscript()` methods in `backend/src/services/zoom.ts`
- Webhook handler for `recording.completed` and `recording.transcript_completed`

**What's missing:**
- Therapist UI to browse/play recordings for a session
- Automatic recording fetch triggered by webhook
- Client-facing recording access (if therapist shares)

**Effort:** ~2-3 days

**Implementation plan:**
1. Add `GET /therapist/bookings/:id/recordings` endpoint
2. Create `RecordingViewer` component in `web/src/features/therapist/`
3. Wire webhook to auto-fetch recording metadata
4. Add "Recordings" tab to `NoteEditor`

---

### 2. Refund Processing

**What exists:**
- Razorpay SDK installed, payment records in DB
- `Payment` model with amount, status fields

**What's missing:**
- `POST /admin/payments/:id/refund` endpoint calling Razorpay refund API
- Admin UI refund button on payment/booking detail
- Partial refund support

**Effort:** ~1-2 days

**Implementation plan:**
1. Add refund endpoint in `backend/src/index.ts`:
   ```typescript
   app.post("/admin/payments/:id/refund", authMiddleware(), adminMiddleware(), async (req, res) => {
     // Call razorpay.payments.refund(paymentId, { amount })
     // Update booking status to "refunded"
     // Log in AdminAuditLog
   });
   ```
2. Add "Refund" button in `AdminDashboard.tsx` bookings tab
3. Add refund status badge

---

### 3. Client Shared Notes Page

**What exists:**
- Notes have `SHARED` and `HOMEWORK` visibility
- `GET /client/my-notes` endpoint exists in `backend/src/routes/notes.ts`
- `MyTherapyTimeline` shows session history

**What's missing:**
- Dedicated "My Notes" page for clients showing therapist-shared notes
- Homework tracking (mark as done)

**Effort:** ~1-2 days

**Implementation plan:**
1. Create `web/src/features/client/MyNotes.tsx`
2. Fetch from `GET /client/my-notes`
3. Display notes grouped by session date
4. Add homework checkbox for `HOMEWORK` visibility notes
5. Add nav link in client dashboard

---

### 4. Therapist Client Management

**What exists:**
- `GET /therapist/clients` returns assigned clients
- `ClientTimeline.tsx` shows individual client history
- `ClientProfile` model in DB

**What's missing:**
- Edit client intake notes / therapy goals from therapist side
- Add emergency contact info
- Client progress summary view

**Effort:** ~2-3 days

**Implementation plan:**
1. Add `PATCH /therapist/clients/:id/profile` endpoint
2. Create `ClientProfileEditor` component
3. Add intake notes form with encrypted storage
4. Add "Edit Profile" button on client detail view

---

### 5. Admin Session Management

**What exists:**
- Sessions in DB with full schema (title, price, duration, tidycalUrl, etc.)
- Seed script creates session types

**What's missing:**
- Admin UI to create/edit/delete session types
- Toggle session availability
- Update pricing without DB access

**Effort:** ~2-3 days

**Implementation plan:**
1. Add CRUD endpoints: `POST/PATCH/DELETE /admin/sessions`
2. Add "Sessions" tab to `AdminDashboard.tsx`
3. Session editor form with fields: title, host, price, duration, tidycalUrl, isActive
4. Drag-and-drop ordering (optional)

---

### 6. Subscription Billing (Real Recurring)

**What exists:**
- `processSubscriptions()` cron job runs daily
- `Subscription` model with status, renewalDate
- Currently just marks as renewed without charging

**What's missing:**
- Razorpay Subscriptions API integration for real recurring charges
- Subscription cancellation/pause flow
- Failed payment retry logic

**Effort:** ~3-5 days

**Implementation plan:**
1. Integrate Razorpay Subscriptions API (`razorpay.subscriptions.create`)
2. Add `POST /subscriptions/:id/cancel` and `/pause` endpoints
3. Handle Razorpay subscription webhooks for payment success/failure
4. Add retry logic for failed renewals
5. Update `SubscriptionsPage.tsx` with cancel/pause buttons

---

## Remaining Features (Not Built)

### Phase 1 — Q2 2026 (High Impact)

#### 1. Push Notifications
**Priority:** High | **Effort:** 3-5 days

Send browser push notifications for session reminders instead of relying solely on email.

**Implementation approach:**
- Use Web Push API with VAPID keys
- Add `PushSubscription` model to store user subscriptions
- Create `backend/src/services/push.ts` service
- Add notification preferences to user profile
- Trigger from existing reminder cron job
- Libraries: `web-push` (backend), `Notification API` (frontend)

**Key files to create:**
- `backend/src/services/push.ts`
- `web/src/components/PushNotificationManager.tsx`
- Migration for `PushSubscription` table

---

#### 2. In-App Messaging
**Priority:** High | **Effort:** 5-8 days

Secure messaging between therapist and client for between-session communication.

**Implementation approach:**
- Create `Message` and `Conversation` models
- Use polling (simpler) or WebSocket (real-time) for delivery
- Encrypt message content using existing `encryption.ts`
- Add unread count badges to dashboards
- File attachment support (optional Phase 2)

**Key files to create:**
- `backend/src/routes/messages.ts`
- `web/src/features/messaging/ConversationList.tsx`
- `web/src/features/messaging/ChatView.tsx`
- Migration for `Conversation`, `Message` tables

**Schema:**
```prisma
model Conversation {
  id            String    @id @default(uuid())
  therapistId   String
  clientId      String
  lastMessageAt DateTime?
  messages      Message[]
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  content        String       // encrypted
  readAt         DateTime?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}
```

---

#### 3. Group Therapy Sessions
**Priority:** Medium | **Effort:** 5-8 days

Support sessions with multiple participants.

**Implementation approach:**
- Add `maxParticipants` field to `Session` model
- Create `SessionParticipant` join table
- Modify booking flow to check capacity
- Shared Zoom meeting link for all participants
- Group note-taking (therapist writes one note for the group)

---

### Phase 2 — Q3 2026 (Differentiation)

#### 4. AI-Powered Session Insights
**Priority:** Medium | **Effort:** 8-12 days

Automatic analysis of therapy notes to surface patterns and suggestions.

**Implementation approach:**
- Integrate OpenAI/Claude API for note analysis
- Generate session summaries from Zoom transcripts
- Pattern detection across multiple sessions (recurring themes, mood trends)
- Suggested interventions based on note content
- Privacy-first: process encrypted notes server-side only

**Key files to create:**
- `backend/src/services/ai.ts`
- `web/src/features/therapist/InsightsPanel.tsx`

---

#### 5. Client Mood Tracking
**Priority:** Medium | **Effort:** 3-5 days

Daily/weekly mood check-ins with trend visualization.

**Implementation approach:**
- Simple 1-5 scale or emoji-based mood input
- Optional journal entry (encrypted)
- Trend chart visible to both client and therapist
- Push notification reminders for check-ins

**Schema:**
```prisma
model MoodEntry {
  id        String   @id @default(uuid())
  userId    String
  rating    Int      // 1-5
  journal   String?  // encrypted
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

**Key files to create:**
- `backend/src/routes/mood.ts`
- `web/src/features/client/MoodTracker.tsx`
- `web/src/features/client/MoodChart.tsx`

---

#### 6. Outcome Measurement Tools
**Priority:** Medium | **Effort:** 5-8 days

Standardized clinical assessment scales.

**Implementation approach:**
- Implement PHQ-9 (depression), GAD-7 (anxiety), WHO-5 (wellbeing)
- Periodic assessment scheduling (every 4 sessions)
- Score tracking with trend visualization
- Therapist can assign assessments to clients
- Results visible in therapist dashboard and client timeline

**Schema:**
```prisma
model Assessment {
  id           String   @id @default(uuid())
  userId       String
  therapistId  String
  type         String   // "PHQ9", "GAD7", "WHO5"
  responses    Json     // encrypted
  totalScore   Int
  severity     String   // "minimal", "mild", "moderate", "severe"
  createdAt    DateTime @default(now())
}
```

---

### Phase 3 — Q4 2026 (Scale)

#### 7. Multi-Therapist Practice Support
**Priority:** Low | **Effort:** 10-15 days

Support practices with multiple therapists sharing an admin.

**Implementation approach:**
- Add `Practice` model as top-level entity
- Therapists belong to a practice
- Practice-level admin vs system admin
- Shared client pool with assignment
- Practice-wide analytics

---

#### 8. Insurance Billing Integration
**Priority:** Low | **Effort:** 10-15 days

Generate insurance claims and superbills.

**Implementation approach:**
- Superbill PDF generation with CPT codes
- Client insurance info storage (encrypted)
- Claim submission tracking
- Integration with clearinghouse APIs (optional)

---

#### 9. Telehealth Compliance Certifications
**Priority:** Low | **Effort:** 5-8 days

HIPAA and regulatory compliance documentation.

**Implementation approach:**
- BAA (Business Associate Agreement) templates
- Consent form management
- Data retention policy enforcement
- Audit trail enhancements
- Compliance dashboard for admin

---

#### 10. Revenue Reports & Exports
**Priority:** Medium | **Effort:** 2-3 days

Export analytics data for accounting.

**Implementation approach:**
- CSV export of bookings, payments, revenue
- Date range filtering
- PDF summary reports
- Scheduled email reports (weekly/monthly)

---

## Implementation Guide

### Development Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Fill in real values
npm run prisma:migrate
npm run seed
npm run dev             # Runs on :4000

# Frontend
cd web
npm install
npm run dev             # Runs on :3000
```

### Environment Variables (Backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64-char hex string for token signing |
| `NOTES_ENCRYPTION_KEY` | 64-char hex string for AES-256-GCM |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RESEND_API_KEY` | Resend email API key |
| `MSG91_AUTH_KEY` | MSG91 OTP key |
| `TIDYCAL_API_TOKEN` | TidyCal personal access token |
| `ZOOM_ACCOUNT_ID` | Zoom Server-to-Server OAuth |
| `ZOOM_CLIENT_ID` | Zoom client ID |
| `ZOOM_CLIENT_SECRET` | Zoom client secret |
| `ZOOM_WEBHOOK_SECRET_TOKEN` | Zoom webhook verification |

### Adding a New Feature (Checklist)

1. **Schema**: Add models to `backend/prisma/schema.prisma`
2. **Migration**: Run `npx prisma migrate dev --name <name>`
3. **Backend route**: Create `backend/src/routes/<feature>.ts`
4. **Register route**: Add `app.use(<routes>)` in `backend/src/index.ts`
5. **API function**: Add fetch function to `web/src/lib/api.ts`
6. **Frontend component**: Create in `web/src/features/<feature>/`
7. **Navigation**: Wire into `web/src/app.tsx` routing
8. **Test locally**: Verify on `localhost:3000`
9. **Commit & push**: Railway auto-deploys from `main`

---

## Architecture Reference

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  web/src/                                                │
│  ├── app.tsx              Main router & layout           │
│  ├── lib/api.ts           All API fetch functions        │
│  ├── features/                                           │
│  │   ├── auth/            Login, signup, onboarding      │
│  │   ├── sessions/        Browse, book, review           │
│  │   ├── bookings/        My bookings, packages          │
│  │   ├── client/          Client dashboard               │
│  │   ├── therapist/       Therapist dashboard, notes     │
│  │   ├── admin/           Admin dashboard                │
│  │   ├── packages/        Package purchase               │
│  │   ├── subscriptions/   Subscription management        │
│  │   ├── referral/        Referral section               │
│  │   └── profile/         User profile                   │
│  └── components/          Shared components (PWA, etc.)  │
├─────────────────────────────────────────────────────────┤
│                    Backend (Express)                      │
│  backend/src/                                            │
│  ├── index.ts             Main app, 44 routes, cron     │
│  ├── middleware/auth.ts   JWT auth, RBAC middleware      │
│  ├── email.ts             Resend emails, ICS generation  │
│  ├── routes/                                             │
│  │   ├── notes.ts         Therapy note CRUD              │
│  │   ├── therapist.ts     Therapist-specific endpoints   │
│  │   ├── clientProfile.ts Client dashboard data          │
│  │   ├── adminTherapist.ts Admin therapist + analytics   │
│  │   └── zoom.ts          Zoom config + webhooks         │
│  └── services/                                           │
│      ├── encryption.ts    AES-256-GCM encrypt/decrypt    │
│      ├── zoom.ts          Zoom OAuth + API service       │
│      └── tidycal.ts       TidyCal sync service           │
├─────────────────────────────────────────────────────────┤
│                    Database (PostgreSQL)                  │
│  Key models: User, Booking, Session, Payment,            │
│  TherapyNote, TherapistProfile, ClientProfile,           │
│  ZoomConfig, ZoomMeeting, ZoomRecording,                 │
│  Subscription, UserPackage, PromoCode, Referral,         │
│  AdminAuditLog                                           │
└─────────────────────────────────────────────────────────┘
```

---

## File Map

| Area | Key Files |
|------|-----------|
| **Auth** | `backend/src/index.ts` (lines 200-530), `web/src/features/auth/otp.tsx` |
| **Sessions** | `web/src/features/sessions/SessionList.tsx`, `SessionDetail.tsx` |
| **Bookings** | `web/src/features/bookings/MyBookings.tsx`, `MyPackages.tsx` |
| **Client** | `web/src/features/client/ClientDashboard.tsx`, `backend/src/routes/clientProfile.ts` |
| **Therapist** | `web/src/features/therapist/TherapistDashboard.tsx`, `NoteEditor.tsx`, `backend/src/routes/therapist.ts` |
| **Notes** | `backend/src/routes/notes.ts`, `backend/src/services/encryption.ts` |
| **Admin** | `web/src/features/admin/AdminDashboard.tsx`, `backend/src/routes/adminTherapist.ts` |
| **Zoom** | `backend/src/services/zoom.ts`, `backend/src/routes/zoom.ts` |
| **TidyCal** | `backend/src/services/tidycal.ts` |
| **Email** | `backend/src/email.ts` |
| **PWA** | `web/src/components/PWAInstallPrompt.tsx`, `web/public/manifest.json` |
| **Security** | `backend/src/middleware/auth.ts`, `backend/src/services/encryption.ts` |
| **DB Schema** | `backend/prisma/schema.prisma` |
| **Migrations** | `backend/prisma/migrations/` |
| **Seed Data** | `backend/prisma/seed.ts` |

---

*This document should be updated as features are completed. Move items from "Not Built" to "Partial" to "Built" as work progresses.*

**© 2026 Evolve with Avadhi. All Rights Reserved.**
