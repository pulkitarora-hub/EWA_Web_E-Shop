# Testing

## Smoke tests
1. Start backend and web app.
2. Login with phone OTP (use the dev OTP shown on screen).
3. Complete onboarding and verify it persists after reload.
4. Open a session and initiate booking.
5. Complete Razorpay checkout on web and verify:
   - Booking status updates to `paid`.
   - Payment record is created.

## API validation
- Check backend logs for `/bookings` and `/payments/verify`.
- Verify invalid signature returns an error.
