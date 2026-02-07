import { createBooking, verifyPayment as verifyPaymentApi } from "../../lib/api";
import { Session } from "../sessions/sessionApi";

export type PolicyData = {
  policySignedName: string;
  policySignature: string;
  policyAgreedAt: string;
};

export async function createBookingAndOrder(
  token: string,
  session: Session,
  policyData?: PolicyData
) {
  if (!session.id) {
    throw new Error("session_id_missing");
  }
  return createBooking(token, session.id, policyData);
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
