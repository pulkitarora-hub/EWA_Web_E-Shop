# Evolve with Avadhi
## Therapy Management System - Feature Documentation

**Version:** 2.0  
**Last Updated:** March 2026  
**Platform:** Web Application (PWA)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Roles & Access](#user-roles--access)
3. [Core Features](#core-features)
4. [Client Features](#client-features)
5. [Therapist Features](#therapist-features)
6. [Admin Features](#admin-features)
7. [Booking & Payments](#booking--payments)
8. [Integrations](#integrations)
9. [Security & Privacy](#security--privacy)
10. [Mobile Experience](#mobile-experience)
11. [Technical Specifications](#technical-specifications)

---

## Executive Summary

**Evolve with Avadhi** is a comprehensive therapy practice management platform designed to streamline the entire therapeutic journey—from booking sessions to maintaining encrypted clinical notes. The platform serves three distinct user types: Clients seeking therapy, Therapists providing care, and Administrators managing the practice.

### Key Highlights

- **End-to-End Session Management**: Book, attend, and review therapy sessions
- **Encrypted Clinical Notes**: AES-256-GCM encryption for sensitive therapy documentation
- **Integrated Scheduling**: Seamless TidyCal + Zoom integration for video sessions
- **Multi-Role Support**: Tailored experiences for clients, therapists, and admins
- **Mobile-Ready PWA**: Installable app with offline support
- **Payment Processing**: Razorpay integration with subscription and package options

---

## User Roles & Access

### Role Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                    ADMIN                             │
│  Full system access, user management, analytics      │
├─────────────────────────────────────────────────────┤
│                  THERAPIST                           │
│  Client management, notes, session documentation     │
├─────────────────────────────────────────────────────┤
│                    CLIENT                            │
│  Book sessions, view shared notes, track journey     │
└─────────────────────────────────────────────────────┘
```

### Role Capabilities Matrix

| Feature | Client | Therapist | Admin |
|---------|:------:|:---------:|:-----:|
| Book Sessions | ✅ | ❌ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ |
| Create Therapy Notes | ❌ | ✅ | ❌ |
| View Shared Notes | ✅ | ✅ | ✅ |
| View Private Notes | ❌ | ✅ | ❌ |
| Manage Clients | ❌ | ✅ | ✅ |
| System Configuration | ❌ | ❌ | ✅ |
| View Analytics | ❌ | Limited | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Process Refunds | ❌ | ❌ | ✅ |

---

## Core Features

### 1. Authentication & Onboarding

#### Multi-Method Authentication
- **Email + Password**: Traditional secure login
- **Google OAuth**: One-click social login
- **OTP Verification**: Phone-based authentication via MSG91

#### User Onboarding Flow
```
Sign Up → Verify Phone → Complete Profile → Accept Policy → Dashboard
```

#### Security Features
- JWT-based session management
- Password reset via secure email links
- Session timeout and refresh tokens
- Policy agreement tracking with digital signature

---

### 2. Session Types

The platform supports various therapy session formats:

| Session Type | Duration | Format | Description |
|--------------|----------|--------|-------------|
| Intro Session | 30 min | Online | Initial consultation |
| Clarity Session | 45-90 min | Online/In-Person | One-time deep work |
| Package Sessions | 60 min | Online | 4 or 8 sessions/month |
| Subscription | 60 min | Online | Monthly recurring |

#### Session Packages

**Steady Inner Balance**
- 4 sessions per month
- 60 minutes each
- Monthly renewal

**Deep Work Subscription**
- 8 sessions per month
- 60 minutes each
- Intensive support

---

## Client Features

### Client Dashboard

The personalized client dashboard provides at-a-glance information:

```
┌─────────────────────────────────────────────────────┐
│  Welcome back, [Name]                                │
│  Your healing journey continues...                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📅 UPCOMING SESSIONS          💳 CREDITS           │
│  ┌─────────────────────┐      ┌──────────────┐     │
│  │ Mar 19 - 2:30 PM    │      │ 3 remaining  │     │
│  │ [Join via Zoom]     │      │ of 4 total   │     │
│  └─────────────────────┘      └──────────────┘     │
│                                                      │
│  🌱 YOUR JOURNEY                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Session 1 ──○── Session 2 ──○── Session 3  │   │
│  │ Completed      Completed      Upcoming      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Key Client Features

#### 1. Session Booking
- Browse available session types
- View pricing and descriptions
- Select preferred time slots via TidyCal
- Secure payment via Razorpay

#### 2. Session Management
- View upcoming sessions with Zoom links
- Access session history
- Cancel or reschedule (with policy adherence)

#### 3. Therapy Journey
- Timeline view of all sessions
- Access to therapist-shared notes
- Track progress over time

#### 4. Credit & Subscription Management
- View remaining session credits
- Track subscription status
- Purchase additional packages

---

## Therapist Features

### Therapist Workspace

A dedicated workspace optimized for clinical workflow:

```
┌─────────────────────────────────────────────────────┐
│  Good morning, Dr. Avadhi                            │
│  ⚠️ 3 notes pending documentation                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  TODAY'S SESSIONS                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ 10:00 AM - Rahul M.      [Start] [Notes]    │   │
│  │ 2:30 PM  - Priya S.      [Start] [Notes]    │   │
│  │ 4:00 PM  - Amit K.       [Start] [Add Note] │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [Overview]  [Clients]  [Pending Notes]              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Key Therapist Features

#### 1. Client Management
- View all assigned clients
- Search and filter clients
- Access complete client history
- View client therapy timelines

#### 2. Session Documentation

**Intuitive Note-Taking Interface**

The note editor uses a section-based wizard approach:

```
[Session Info] → [Observations] → [Interventions] → [Private] → [Recordings]
     ●              ○                  ○               ○            ○
```

**Note Sections:**

| Section | Content | Shareable with Client |
|---------|---------|:---------------------:|
| Session Info | Date, duration, type | ✅ |
| Observations | Client presentation, mood | Configurable |
| Interventions | Techniques applied | Configurable |
| Homework | Assignments for client | ✅ |
| Private Notes | Internal observations | ❌ Never |
| Recordings | Zoom recordings/transcripts | Configurable |

#### 3. Pending Notes Tracker
- Dashboard alert for incomplete documentation
- Quick access to sessions needing notes
- Compliance tracking for record-keeping

#### 4. Zoom Integration
- One-click session start
- Access to cloud recordings
- Automatic transcript integration
- Recording download options

---

## Admin Features

### Admin Dashboard

Comprehensive practice management interface:

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                    [Logout]         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 QUICK STATS                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  127   │ │  ₹45K  │ │   12   │ │    8   │       │
│  │ Users  │ │Revenue │ │Bookings│ │Sessions│       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                      │
│  [Users] [Sessions] [Payments] [Promos] [Zoom]      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Admin Capabilities

#### 1. User Management
- View all users with role filtering
- Create therapist accounts
- Modify user roles and permissions
- Audit user activity

#### 2. Session Management
- Create and edit session types
- Set pricing and availability
- Configure TidyCal URLs
- Toggle in-person options

#### 3. Payment Administration
- View all transactions
- Process refunds
- Generate revenue reports
- Track subscription renewals

#### 4. Promo Code System
- Create discount codes
- Set usage limits and expiry
- Track code performance
- Percentage or fixed discounts

#### 5. Referral Program
- Track referral signups
- Manage referral credits
- View referral analytics

#### 6. Integration Management
- Configure Zoom credentials
- Test API connections
- View TidyCal sync status
- Manage webhook endpoints

#### 7. Audit Logging
- Track all admin actions
- User modification history
- Payment processing logs
- Security event tracking

---

## Booking & Payments

### Booking Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browse  │───▶│  Select  │───▶│   Pay    │───▶│  Choose  │
│ Sessions │    │ Package  │    │(Razorpay)│    │Time Slot │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Attend  │◀───│  Receive │◀───│   Zoom   │◀───│  Confirm │
│ Session  │    │ Reminder │    │Link Sync │    │ Booking  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Payment Options

#### Supported Methods (via Razorpay)
- Credit/Debit Cards
- UPI (GPay, PhonePe, Paytm)
- Net Banking
- Wallets

#### Pricing Features
- Dynamic pricing per session type
- Package discounts
- Promo code support
- Referral credits
- Session credit system

### Automated Notifications

| Trigger | Channel | Timing |
|---------|---------|--------|
| Booking Confirmed | Email | Immediate |
| Session Reminder | Email | 24 hours before |
| Session Reminder | Email | 1 hour before |
| Payment Receipt | Email | Immediate |

---

## Integrations

### TidyCal Integration

**Purpose:** Appointment scheduling and calendar management

**Features:**
- Automatic booking sync every 5 minutes
- Captures actual meeting times
- Retrieves Zoom meeting URLs
- Syncs with therapist's calendar

**Data Synced:**
```
TidyCal Booking → Our System
├── Booking ID
├── Contact Email (for matching)
├── Meeting URL (Zoom link)
├── Start Time
├── End Time
└── Booking Status
```

### Zoom Integration

**Purpose:** Video conferencing for therapy sessions

**Features:**
- Server-to-Server OAuth (no user login needed)
- Automatic meeting creation
- Cloud recording access
- Transcript retrieval
- Webhook notifications

**Supported Events:**
- `meeting.started` - Session begins
- `meeting.ended` - Session concludes
- `recording.completed` - Recording ready
- `recording.transcript_completed` - Transcript ready

### Razorpay Integration

**Purpose:** Payment processing

**Features:**
- Secure checkout flow
- Multiple payment methods
- Automatic receipt generation
- Refund processing
- Webhook for payment status

### MSG91 Integration

**Purpose:** SMS/OTP verification

**Features:**
- Phone number verification
- OTP delivery
- Template-based messaging

### Resend Integration

**Purpose:** Transactional emails

**Features:**
- Booking confirmations
- Session reminders
- Password reset emails
- Calendar invites (.ics)

---

## Security & Privacy

### Data Protection

#### Encryption at Rest
- **Therapy Notes**: AES-256-GCM encryption
- **Zoom Credentials**: Encrypted storage
- **Passwords**: bcrypt hashing (cost factor 10)

#### Encryption in Transit
- HTTPS/TLS for all communications
- Secure WebSocket connections

### Access Control

#### Role-Based Access Control (RBAC)
```javascript
// Example: Only therapists can create notes
requireRole("THERAPIST") → Create Note API
```

#### API Security
- JWT token validation
- Token expiration (24 hours)
- Refresh token rotation

### Audit Trail

All sensitive actions are logged:
- User creation/modification
- Role changes
- Payment processing
- Note access
- Admin actions

### Privacy Compliance

- **Data Minimization**: Only collect necessary data
- **Consent Management**: Policy agreement tracking
- **Right to Access**: Users can view their data
- **Data Retention**: Configurable retention policies

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## Mobile Experience

### Progressive Web App (PWA)

The application is a fully-featured PWA, providing a native-like experience:

#### Installation
- **Android**: "Add to Home Screen" prompt
- **iOS**: Share → "Add to Home Screen"
- **Desktop**: Install icon in browser

#### Offline Capabilities
- Cached pages for offline access
- Offline fallback page
- Background sync for notes (when online)

#### Mobile Optimizations
- Touch-friendly 44px tap targets
- Safe area support (iPhone notch)
- Smooth iOS scrolling
- Responsive layouts for all screen sizes

### Responsive Design

All interfaces adapt to screen size:

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked cards |
| Tablet (640-1024px) | Two columns |
| Desktop (>1024px) | Full layout |

---

## Technical Specifications

### Technology Stack

#### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework |
| React 18 | UI library |
| Tailwind CSS 4 | Styling |
| TypeScript | Type safety |

#### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| Prisma | ORM |
| PostgreSQL | Database |

#### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel/Railway | Hosting |
| PostgreSQL | Database |
| Resend | Email |
| MSG91 | SMS |

### API Architecture

RESTful API with the following structure:

```
/auth/*           - Authentication endpoints
/sessions/*       - Session management
/bookings/*       - Booking operations
/payments/*       - Payment processing
/therapist/*      - Therapist-specific
/client/*         - Client-specific
/admin/*          - Admin operations
/zoom/*           - Zoom integration
```

### Database Schema (Key Models)

```
User
├── id, email, phone, role
├── passwordHash, googleId
└── profiles (Therapist/Client)

Booking
├── id, userId, sessionId
├── status, amount
├── meetingUrl, actualStartTime
└── zoomMeeting, therapyNote

TherapyNote
├── id, bookingId, therapistId
├── sessionSummary (encrypted)
├── observations (encrypted)
├── interventions (encrypted)
├── privateNotes (encrypted)
└── sharedWithClient, attachments, tags
```

---

## Future Roadmap

### Planned Features

#### Phase 1 (Q2 2026)
- [ ] Push notifications for session reminders
- [ ] In-app messaging between client and therapist
- [ ] Group therapy session support

#### Phase 2 (Q3 2026)
- [ ] AI-powered session insights
- [ ] Mood tracking for clients
- [ ] Outcome measurement tools

#### Phase 3 (Q4 2026)
- [ ] Multi-therapist practice support
- [ ] Insurance billing integration
- [ ] Telehealth compliance certifications

---

## Support & Contact

**Technical Support:** support@evolvewithavadhi.com  
**Documentation:** docs.evolvewithavadhi.com  
**Status Page:** status.evolvewithavadhi.com

---

*This document is confidential and intended for authorized stakeholders only.*

**© 2026 Evolve with Avadhi. All Rights Reserved.**
