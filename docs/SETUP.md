# Setup

## Backend (Node + Postgres)
1. Create a Postgres database (local).
2. Copy `backend/.env.example` to `backend/.env` and set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Install deps:
   - `cd backend && npm install`
4. Run migrations:
   - `npm run prisma:migrate`
5. Seed sessions:
   - `npm run seed`
6. Start API:
   - `npm run dev`

## Web
Set `web/.env.local`:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`

## Mobile
Set `mobile/.env`:
- `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000`

## Razorpay checkout
- Web: Razorpay checkout script already included.
- Mobile: install `react-native-razorpay` and use the native checkout.
