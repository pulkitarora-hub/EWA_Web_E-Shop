import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type User = {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  goal?: string | null;
  onboardingComplete: boolean;
  isAdmin: boolean;
};

export type Session = {
  id: string;
  title: string;
  host: string;
  startTime: string;
  price: number;
  currency: string;
  tidycalUrl?: string | null;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(optHeaders || {}) },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "request_failed");
  }
  return (await res.json()) as T;
}

export async function requestOtp(phone: string) {
  return request<{ otpToken: string; otp: string }>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(otpToken: string, otp: string) {
  return request<{ token: string; user: User }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ otpToken, otp }),
  });
}

export async function getMe(token: string) {
  return request<{ user: User }>("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMe(
  token: string,
  data: { name: string; goal: string; email?: string; onboardingComplete: boolean }
) {
  return request<{ user: User }>("/users/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function fetchSessions() {
  return request<{ sessions: Session[] }>("/sessions");
}

export async function createBooking(token: string, sessionId: string) {
  return request<{
    bookingId: string;
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
  }>("/bookings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId }),
  });
}

export async function verifyPayment(
  token: string,
  input: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }
) {
  return request<{ booking: any }>("/payments/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export async function persistAuth(token: string, user: User) {
  await AsyncStorage.setItem("authToken", token);
  await AsyncStorage.setItem("authUser", JSON.stringify(user));
}

export async function clearAuth() {
  await AsyncStorage.removeItem("authToken");
  await AsyncStorage.removeItem("authUser");
}

export async function loadAuth(): Promise<{ token: string; user: User } | null> {
  const token = await AsyncStorage.getItem("authToken");
  const userRaw = await AsyncStorage.getItem("authUser");
  if (!token || !userRaw) return null;
  return { token, user: JSON.parse(userRaw) as User };
}
