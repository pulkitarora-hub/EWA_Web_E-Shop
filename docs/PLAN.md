# Project Plan

## Context
- This repo contains three apps: `backend/` (Node + Express + Prisma), `web/` (Next.js), and `mobile/` (Expo).
- Core flows include onboarding, OTP auth, sessions and bookings, packages/subscriptions, referrals, and admin.

## Goals
- Provide a stable API for auth, sessions, bookings, packages, referrals, and admin workflows.
- Deliver a responsive web experience for users and admins.
- Deliver a mobile experience for users with parity to the core web flows.

## Non-Goals (for now)
- Full multi-tenant support.
- Internationalization and multi-currency pricing.
- Offline-first behavior on mobile.

## Architecture Overview
- Backend:
  - Express API in `backend/src/index.ts`.
  - Prisma schema in `backend/prisma/schema.prisma`.
  - Cron and email utilities in `backend/src/email.ts`.
- Web:
  - Next.js app in `web/src/app/` with feature-based UI in `web/src/features/`.
- Mobile:
  - Expo app in `mobile/src/` with feature-based UI in `mobile/src/features/`.

## Core Features
- Auth:
  - OTP login + Google OAuth support.
  - JWT-backed sessions for API access.
- Sessions and bookings:
  - List sessions, view details, book or reschedule, cancellations.
  - Policies and signatures captured on web.
- Packages and subscriptions:
  - Packages for session bundles and subscription flows.
- Referrals and promos:
  - Referral codes and promo discounts.
- Admin:
  - Dashboard for session management and user support tasks.

## Integrations
- Payments:
  - Razorpay for web checkout and mobile payment integration.
- Email:
  - Resend for transactional emails.
- Calendar:
  - ICS exports for session scheduling.

## Data and Migrations
- Prisma migrations live in `backend/prisma/migrations/`.
- Seed data is populated by `npm run seed` in `backend/`.

## Environment Configuration
- Backend requires `DATABASE_URL`, `JWT_SECRET`, and Razorpay keys.
- Web requires `NEXT_PUBLIC_API_BASE_URL`.
- Mobile requires `EXPO_PUBLIC_API_BASE_URL`.

## Deployment Notes
- Backend should run with `prisma migrate deploy` during production start.
- Web requires environment variables and a compatible Node runtime.
- Mobile uses Expo build and store distribution.

## Testing and Quality
- API:
  - Add integration tests for auth, booking, and payment flows.
- Web/Mobile:
  - Add smoke tests for onboarding, sessions list, booking flows.
- CI:
  - Run lint and typecheck for web.

## Milestones
1. Stabilize auth and booking APIs.
2. Ensure web and mobile parity for booking + packages.
3. Add admin workflows for refunds and cancellations.
4. Add reporting and analytics exports.

## Open Questions
- Payment reconciliation workflow for refunds and partial refunds.
- Desired roles and permissions model for admins.
- Expected volume and rate limits for OTP and booking APIs.
