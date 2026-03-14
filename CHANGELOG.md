# Changelog

## [2.0.0] - 2026-03-14 - Therapy Management System Evolution

### Overview
Major evolution of the application from a simple booking system to a comprehensive Therapy Management System with multi-role support, therapy notes, and integrated scheduling.

---

### New Features

#### 1. Multi-Role User System
- **Three distinct roles**: CLIENT, THERAPIST, ADMIN
- Role-based access control (RBAC) middleware
- Dynamic navigation based on user role
- Role-specific default landing pages:
  - CLIENT → Client Dashboard
  - THERAPIST → Therapist Workspace
  - ADMIN → Admin Dashboard

#### 2. Therapist Workspace
- **New dashboard** for therapists with:
  - Today's sessions overview
  - Upcoming sessions list
  - Client management panel
  - Quick actions for notes and session management
- **Intuitive note-taking interface**:
  - Section-based wizard (Session Info → Observations → Interventions → Private Notes → Recordings)
  - Progress indicator
  - Auto-save functionality
  - Tag management for notes
  - File attachments support

#### 3. Client Dashboard
- Personalized dashboard for clients showing:
  - Upcoming sessions with Zoom links
  - Credits and subscription status
  - Therapy journey timeline
  - Session history with notes (therapist-shared only)

#### 4. Therapy Notes System
- **Encrypted storage** (AES-256-GCM) for sensitive therapy notes
- Structured note format:
  - Session observations
  - Interventions applied
  - Homework assignments
  - Private therapist notes (never shared with client)
- Note sharing controls (therapist decides what client sees)
- Audit logging for all note access

#### 5. TidyCal Integration
- **Automatic sync** of TidyCal bookings every 5 minutes
- Captures actual Zoom meeting URLs from TidyCal
- Updates booking records with:
  - Actual meeting start/end times
  - Zoom meeting links
  - TidyCal booking IDs
- Admin endpoint for manual sync trigger

#### 6. Zoom Integration Infrastructure
- Server-to-Server OAuth setup
- Meeting creation capabilities
- Recording sync infrastructure
- Webhook handlers for meeting events
- Admin configuration panel

---

### Database Changes

#### New Models
```prisma
- TherapistProfile    # Therapist-specific profile data
- ClientProfile       # Client therapy journey data
- TherapyNote         # Encrypted session notes
- NoteAttachment      # File attachments for notes
- NoteTag             # Tagging system for notes
- ZoomConfig          # Zoom API credentials storage
- ZoomMeeting         # Meeting records
- ZoomRecording       # Recording metadata
```

#### Updated Models
```prisma
- User                # Added role enum (CLIENT, THERAPIST, ADMIN)
- Booking             # Added TidyCal sync fields:
                      #   - tidycalBookingId
                      #   - meetingUrl
                      #   - actualStartTime
                      #   - actualEndTime
                      #   - tidycalSyncedAt
```

---

### Backend Changes

#### New Services
- `backend/src/services/tidycal.ts` - TidyCal API integration
- `backend/src/services/zoom.ts` - Zoom API integration
- `backend/src/services/encryption.ts` - AES-256-GCM encryption

#### New Routes
- `backend/src/routes/therapist.ts` - Therapist dashboard & client management
- `backend/src/routes/clientProfile.ts` - Client dashboard & timeline
- `backend/src/routes/therapyNotes.ts` - CRUD for therapy notes
- `backend/src/routes/zoom.ts` - Zoom webhooks & admin config
- `backend/src/routes/adminTherapist.ts` - Admin therapist management

#### New Middleware
- `backend/src/middleware/auth.ts` - Centralized auth with role checks

#### Cron Jobs
- TidyCal sync every 5 minutes
- Session reminders (existing)
- Subscription processing (existing)

---

### Frontend Changes

#### New Components
- `web/src/features/therapist/TherapistDashboard.tsx`
- `web/src/features/therapist/NoteEditor.tsx`
- `web/src/features/client/ClientDashboard.tsx`

#### Updated Components
- `AdminDashboard.tsx` - Complete redesign with:
  - Gradient header design
  - Pill-style tab navigation
  - Zoom configuration panel
  - TidyCal status display
- `app.tsx` - Role-based routing and navigation

#### New API Functions
- `fetchTherapistDashboard()`
- `fetchClientDashboard()`
- `fetchTherapistClients()`
- `createTherapyNote()`, `updateTherapyNote()`, `fetchTherapyNote()`
- `fetchZoomConfig()`, `saveZoomConfig()`, `testZoomConnection()`
- TidyCal sync endpoints

---

### Security Enhancements

1. **Therapy note encryption** - All sensitive content encrypted at rest
2. **Role-based middleware** - `requireRole()` for route protection
3. **Audit logging** - Extended to track therapy-related actions
4. **Zoom credential encryption** - API secrets stored encrypted

---

### Configuration

#### New Environment Variables
```env
TIDYCAL_API_TOKEN=     # TidyCal Personal Access Token
ZOOM_ACCOUNT_ID=       # Zoom Server-to-Server OAuth
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_WEBHOOK_SECRET_TOKEN=
NOTES_ENCRYPTION_KEY=  # 32-byte hex key for note encryption
```

#### New Files
- `backend/.env.example` - Environment template
- `CREDENTIALS.md` - Credentials documentation (gitignored)

---

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| test@evolve.com | test1234 | ADMIN |
| manvi@admin.com | test1234 | CLIENT |
| therapistavadhi@test.com | test1234 | THERAPIST |

---

### Migration Notes

1. Run `npx prisma migrate dev` to apply schema changes
2. Set new environment variables before deployment
3. Seed database with therapist profiles if needed
4. Configure TidyCal token for booking sync
