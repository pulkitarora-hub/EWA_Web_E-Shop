import { createBooking, verifyPayment as verifyPaymentApi } from "../../lib/api";
import { Session } from "../sessions/sessionApi";

export async function createBookingAndOrder(
  token: string,
  session: Session
) {
  return createBooking(token, session.id);
}

export async function verifyPayment(input: {
  token: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { token, ...payload } = input;
  await verifyPaymentApi(token, payload);
}
