Agent Session Record
Date: 2026-03-14

Context
- User requested redesign of login page with split-screen layout
- User requested sessions to match policy sheet document (Deep Work, Steady Inner Balance, Standalone Clarity)
- User requested sessions page redesign with tabs, package cards, and duration selection
- User requested TidyCal integration with auto-populated user details
- User requested in-person add-on toggle for standalone sessions
- User requested package/session tracking for users

Goals
- Redesign login page for better UX
- Update session types to match official policy sheet
- Create intuitive sessions booking interface with packages and single sessions
- Integrate TidyCal calendar with pre-filled user information
- Add in-person session option for standalone clarity sessions
- Enable users to track their package credits and session usage

Findings
- TidyCal supports URL parameters for pre-filling name and email
- Policy sheet defines 3 plan types: Deep Work (8 sessions/month), Steady Inner Balance (4 sessions/month), Standalone Clarity Sessions
- Each plan type has 4 duration options: 45, 60, 75, 90 minutes
- In-person sessions have an additional ₹500 add-on fee
- TidyCal booking types available: 45-min online, 60-min online, in-person (75 and 90-min need to be created)

Changes
- **Login Page (`web/src/features/auth/otp.tsx`)**:
  - Redesigned with split-screen layout (branding left, form right)
  - Removed Mobile OTP login option
  - Added responsive design for mobile

- **Sessions Page (`web/src/features/sessions/SessionList.tsx`)**:
  - Added tabbed interface: "Single Sessions" and "Monthly Packages"
  - Created PackageCard component with benefits, duration pills, pricing
  - Added InPersonToggle component for session type selection
  - Implemented Option A: Global toggle for standalone sessions in-person add-on
  - Added ₹500 in-person add-on with dynamic price display

- **Session Detail (`web/src/features/sessions/SessionDetail.tsx`)**:
  - Added userEmail prop for TidyCal pre-fill
  - Built tidycalUrlWithParams to append name and email to booking URL

- **My Packages (`web/src/features/bookings/MyPackages.tsx`)** [NEW]:
  - Created component for tracking package credits
  - Progress rings showing sessions completed/remaining
  - Status badges for active/completed packages
  - Integrated into MyBookings page

- **Backend Seed (`backend/prisma/seed.ts`)**:
  - Added test admin user: test@evolve.com / test1234
  - Added 12 session types based on policy sheet
  - Added TidyCal URL mappings for each session duration
  - Uses referralCode for user upsert (email not unique)

- **Policy Modal (`web/src/features/sessions/PolicyModal.tsx`)**:
  - Updated policy link to https://policies.evolvewithavadhi.com/acknowledge

- **App Footer (`web/src/app.tsx`)**:
  - Updated email from avadhisharma.com to evolvewithavadhi.com

Actions Taken
- Redesigned login page with multiple iterations based on feedback
- Created visual mockups for in-person toggle options (A-D)
- Implemented Option A: Global toggle above standalone sessions grid
- Added TidyCal URL parameter building for auto-population
- Created MyPackages component with progress tracking UI
- Updated seed data with policy-based session types
- Fixed Next.js cache corruption by clearing .next folder

Commands Run
- `npm run build` (web) - verify compilation
- `npm run seed` (backend) - update session data
- `rm -rf .next` (web) - clear corrupted cache

Migrations / DB Changes
- No new migrations required
- Seed data updated with 12 session types and TidyCal URLs

Follow-ups
- Create 75-min and 90-min online booking types in TidyCal
- Update TidyCal URL mappings once new booking types are created
- Consider adding in-person session type to packages (currently only standalone)
- Test TidyCal pre-fill on production environment
- Verify all session prices match policy sheet

Resume Quickly
- Dev server running on: http://localhost:3001 (port 3000 may still be occupied)
- Test login: test@evolve.com / test1234
- Key files modified:
  - `web/src/features/sessions/SessionList.tsx` - main sessions UI
  - `web/src/features/sessions/SessionDetail.tsx` - TidyCal integration
  - `web/src/features/auth/otp.tsx` - login page
  - `backend/prisma/seed.ts` - session data
- In-person add-on: ₹500 (constant STANDALONE_INPERSON_ADDON)

Notes
- TidyCal URL format: `https://tidycal.com/avadhisharma/{booking-type}?name={name}&email={email}`
- Available TidyCal booking types: individual-therapy-45-minutes-online, ic-off-ses-1hr, ic-off-ses-1hr-3lgq6nv (in-person)
- 75-min and 90-min online sessions currently fallback to 60-min TidyCal booking
- Session data uses titlePattern matching for TidyCal URL assignment
