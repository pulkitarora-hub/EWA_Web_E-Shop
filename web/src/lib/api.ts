const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type User = {
  id: string;
  phone?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
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

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function googleAuth(idToken: string) {
  return request<{ token: string; user: User }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function requestOtp(phone: string) {
  return request<{ otpToken: string; otp?: string }>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(otpToken: string, otp: string, phone?: string) {
  return request<{ token: string; user: User }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ otpToken, otp, phone }),
  });
}

export async function getMe(token: string) {
  return request<{ user: User }>("/me", {
    headers: authHeaders(token),
  });
}

export async function updateMe(
  token: string,
  data: { name?: string; goal?: string; email?: string; phone?: string; onboardingComplete?: boolean }
) {
  return request<{ user: User }>("/users/me", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchSessions() {
  return request<{ sessions: Session[] }>("/sessions");
}

export async function createBooking(
  token: string,
  sessionId: string,
  policyData?: {
    policySignedName: string;
    policySignature: string;
    policyAgreedAt: string;
  }
) {
  return request<{
    bookingId: string;
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
  }>("/bookings", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ sessionId, ...policyData }),
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
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function fetchAdminUsers(token: string) {
  return request<{ users: User[] }>("/admin/users", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminBookings(token: string) {
  return request<{ bookings: any[] }>("/admin/bookings", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminPayments(token: string) {
  return request<{ payments: any[] }>("/admin/payments", {
    headers: authHeaders(token),
  });
}
