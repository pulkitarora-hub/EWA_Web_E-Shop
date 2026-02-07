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
  },
  extras?: {
    promoCode?: string;
    useCredit?: boolean;
  }
) {
  return request<{
    bookingId: string;
    orderId?: string;
    amount: number;
    originalAmount?: number;
    promoDiscount?: number;
    referralDiscount?: number;
    currency: string;
    razorpayKeyId?: string;
    usedCredit?: boolean;
  }>("/bookings", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ sessionId, ...policyData, ...extras }),
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

// ─── My Bookings ─────────────────────────────────────────────────────────────

export type BookingWithSession = {
  id: string;
  userId: string;
  sessionId: string;
  status: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  session: Session;
  review?: ReviewData | null;
};

export type ReviewData = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export type SessionReviews = {
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user: { name?: string | null; avatarUrl?: string | null };
  }>;
  averageRating: number;
  count: number;
};

export async function fetchMyBookings(token: string) {
  return request<{ bookings: BookingWithSession[] }>("/my-bookings", {
    headers: authHeaders(token),
  });
}

export async function cancelBooking(token: string, bookingId: string, reason?: string) {
  return request<{ booking: BookingWithSession }>(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });
}

export async function submitReview(
  token: string,
  bookingId: string,
  rating: number,
  comment?: string
) {
  return request<{ review: ReviewData }>(`/bookings/${bookingId}/review`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ rating, comment }),
  });
}

export async function fetchSessionReviews(sessionId: string) {
  return request<SessionReviews>(`/sessions/${sessionId}/reviews`);
}

// ─── Packages ────────────────────────────────────────────────────────────────

export type PackageType = {
  id: string;
  name: string;
  sessionCount: number;
  price: number;
  currency: string;
  description?: string | null;
  active: boolean;
};

export type UserPackageType = {
  id: string;
  creditsTotal: number;
  creditsUsed: number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  package: PackageType;
};

export async function fetchPackages() {
  return request<{ packages: PackageType[] }>("/packages");
}

export async function purchasePackage(token: string, packageId: string) {
  return request<{
    userPackageId: string;
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
  }>(`/packages/${packageId}/purchase`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function verifyPackagePayment(
  token: string,
  input: {
    userPackageId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }
) {
  return request<{ userPackage: UserPackageType }>("/packages/verify-payment", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function fetchMyPackages(token: string) {
  return request<{ packages: UserPackageType[]; totalCredits: number }>("/my-packages", {
    headers: authHeaders(token),
  });
}

// ─── Promo Codes ─────────────────────────────────────────────────────────────

export type PromoValidation = {
  valid: boolean;
  code: string;
  type: string;
  value: number;
  discount: number;
  description: string;
};

export async function validatePromoCode(token: string, code: string, amount: number) {
  return request<PromoValidation>("/promo-codes/validate", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ code, amount }),
  });
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type SubscriptionType = {
  id: string;
  sessionTitle: string;
  frequency: string;
  price: number;
  currency: string;
  status: string;
  nextBillingAt: string;
  createdAt: string;
};

export async function createSubscription(
  token: string,
  data: { sessionTitle: string; frequency: string; price: number }
) {
  return request<{ subscription: SubscriptionType }>("/subscriptions", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchMySubscriptions(token: string) {
  return request<{ subscriptions: SubscriptionType[] }>("/my-subscriptions", {
    headers: authHeaders(token),
  });
}

export async function cancelSubscription(token: string, id: string) {
  return request<{ subscription: SubscriptionType }>(`/subscriptions/${id}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function pauseSubscription(token: string, id: string) {
  return request<{ subscription: SubscriptionType }>(`/subscriptions/${id}/pause`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

// ─── Referral ────────────────────────────────────────────────────────────────

export async function fetchMyReferralCode(token: string) {
  return request<{
    referralCode: string;
    referrals: Array<{ id: string; status: string; referee: { name?: string | null; createdAt: string } }>;
  }>("/my-referral-code", { headers: authHeaders(token) });
}

export async function applyReferralCode(token: string, code: string) {
  return request<{ message: string }>("/referral/apply", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

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

export type PromoCodeType = {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses?: number | null;
  usedCount: number;
  minAmount?: number | null;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
};

export async function fetchAdminPromoCodes(token: string) {
  return request<{ promoCodes: PromoCodeType[] }>("/admin/promo-codes", {
    headers: authHeaders(token),
  });
}

export async function createAdminPromoCode(
  token: string,
  data: { code: string; type: string; value: number; maxUses?: number; minAmount?: number; expiresAt?: string }
) {
  return request<{ promoCode: PromoCodeType }>("/admin/promo-codes", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function toggleAdminPromoCode(token: string, id: string, active: boolean) {
  return request<{ promoCode: PromoCodeType }>(`/admin/promo-codes/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ active }),
  });
}

export async function deleteAdminPromoCode(token: string, id: string) {
  return request<{ ok: boolean }>(`/admin/promo-codes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
