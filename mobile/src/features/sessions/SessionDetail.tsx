import React, { useState } from "react";
import { View, Text, Button, Alert, Linking } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { Session } from "./sessionApi";
import { createBookingAndOrder, verifyPayment } from "../bookings/bookingApi";

type Props = {
  session: Session;
  token: string;
};

export function SessionDetail({ session, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setStatus(null);
    try {
      const order = await createBookingAndOrder(token, session);
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "Session Booking",
        description: session.title,
        order_id: order.orderId,
      };
      const response = await RazorpayCheckout.open(options);
      await verifyPayment({
        token,
        bookingId: order.bookingId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      setStatus("Payment successful. Booking confirmed.");
      if (session.tidycalUrl) {
        Linking.openURL(session.tidycalUrl);
      }
    } catch (err) {
      Alert.alert("Payment failed", "Please try again.");
      setStatus("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>{session.title}</Text>
      <Text>{session.host}</Text>
      <Text>
        {session.currency} {session.price}
      </Text>
      <Button title="Pay and book" onPress={startCheckout} disabled={loading} />
      {status && <Text>{status}</Text>}
    </View>
  );
}
