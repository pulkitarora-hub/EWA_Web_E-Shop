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
  role: "CLIENT" | "THERAPIST" | "ADMIN";
  policySignedAt?: string | null;
  policySignedName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAuditLog = {
  id: string;
  action: string;
  metadata?: any;
  createdAt: string;
  adminUser: User;
};

export type AdminUserDetail = {
  user: User;
  bookings: any[];
  payments: any[];
  userPackages: any[];
  subscriptions: any[];
  referralsMade: any[];
  referralsReceived: any[];
  auditLogs: AdminAuditLog[];
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

export async function signUpWithPassword(data: {
  email?: string;
  phone?: string;
  password: string;
  name?: string;
}) {
  return request<{ token: string; user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginWithPassword(data: {
  email?: string;
  phone?: string;
  password: string;
}) {
  return request<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ ok: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(input: { email: string; token: string; password: string }) {
  return request<{ ok: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
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

export async function fetchAdminUsers(
  token: string,
  params?: {
    search?: string;
    isAdmin?: boolean | "all";
    onboardingComplete?: boolean | "all";
    page?: number;
    pageSize?: number;
    sortBy?: "createdAt" | "name";
    sortDir?: "asc" | "desc";
    startDate?: string;
    endDate?: string;
  }
) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isAdmin !== undefined && params.isAdmin !== "all") {
    query.set("isAdmin", String(params.isAdmin));
  }
  if (params?.onboardingComplete !== undefined && params.onboardingComplete !== "all") {
    query.set("onboardingComplete", String(params.onboardingComplete));
  }
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortDir) query.set("sortDir", params.sortDir);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return request<{ users: User[]; page: number; pageSize: number; total: number }>(
    `/admin/users${qs ? `?${qs}` : ""}`,
    {
      headers: authHeaders(token),
    }
  );
}

export async function fetchAdminUserDetail(token: string, id: string) {
  return request<AdminUserDetail>(`/admin/users/${id}`, {
    headers: authHeaders(token),
  });
}

export async function updateAdminUser(
  token: string,
  id: string,
  data: {
    name?: string;
    goal?: string;
    email?: string;
    phone?: string;
    onboardingComplete?: boolean;
    isAdmin?: boolean;
  }
) {
  return request<{ user: User }>(`/admin/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function bulkUpdateAdminUsers(
  token: string,
  input: { ids: string[]; action: "set_admin" | "remove_admin" | "mark_onboarded" | "mark_not_onboarded" }
) {
  return request<{ updatedCount: number }>("/admin/users/bulk", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
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

export async function fetchAdminReviews(
  token: string,
  params?: { search?: string; rating?: number }
) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (typeof params?.rating === "number") query.set("rating", String(params.rating));
  const qs = query.toString();
  return request<{ reviews: any[] }>(`/admin/reviews${qs ? `?${qs}` : ""}`, {
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

export type AdminSession = {
  id: string;
  title: string;
  host: string;
  startTime: string;
  price: number;
  currency: string;
  tidycalUrl?: string | null;
  therapistId?: string | null;
  therapist?: { user?: { name?: string | null; email?: string | null } } | null;
};

export async function fetchAdminSessions(token: string) {
  return request<{ sessions: AdminSession[] }>("/admin/sessions", { headers: authHeaders(token) });
}

export async function createAdminSession(token: string, data: { title: string; host: string; startTime?: string; price?: number; currency?: string; tidycalUrl?: string; therapistId?: string }) {
  return request<{ session: AdminSession }>("/admin/sessions", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export async function updateAdminSession(token: string, id: string, data: { title?: string; host?: string; startTime?: string; price?: number; currency?: string; tidycalUrl?: string; therapistId?: string }) {
  return request<{ session: AdminSession }>(`/admin/sessions/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export async function deleteAdminSession(token: string, id: string) {
  return request<{ success: boolean }>(`/admin/sessions/${id}`, { method: "DELETE", headers: authHeaders(token) });
}


// ─── Therapist Types ──────────────────────────────────────────────────────────

export type TherapyNote = {
  id: string;
  bookingId: string;
  therapistId: string;
  clientId: string;
  sessionSummary?: string | null;
  keyThemes: string[];
  emotionalState?: string | null;
  moodRating?: number | null;
  observations?: string | null;
  interventions?: string | null;
  actionItems?: string | null;
  nextSessionFocus?: string | null;
  internalNotes?: string | null;
  visibility: "PRIVATE" | "SHARED" | "HOMEWORK";
  sharedAt?: string | null;
  tags: NoteTag[];
  attachments?: NoteAttachment[];
  booking?: BookingWithSession;
  createdAt: string;
  updatedAt: string;
};

export type NoteTag = {
  id: string;
  tag: string;
  category: string;
};

export type NoteAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
};

export type TherapistClient = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  totalSessions: number;
  lastSessionDate: string;
};

export type ClientProfile = {
  id: string;
  userId: string;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  therapyGoals?: string | null;
  intakeNotes?: string | null;
  dateOfBirth?: string | null;
};

export type TimelineEntry = {
  bookingId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionHost: string;
  note: TherapyNote | null;
};

export type AnalyticsData = {
  totalBookings: number;
  paidBookings: number;
  cancelledBookings: number;
  completionRate: number;
  totalRevenue: number;
  activeClients: number;
  totalNotes: number;
  noteCompletionRate: number;
  therapistCount: number;
};

// ─── Therapist Dashboard API ──────────────────────────────────────────────────

export async function fetchTherapistDashboard(token: string) {
  return request<{
    todaySessions: any[];
    upcomingSessions: any[];
    pendingNotesCount: number;
    totalClients: number;
  }>("/therapist/dashboard", { headers: authHeaders(token) });
}

export async function fetchTherapistClients(token: string, search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<{ clients: TherapistClient[] }>(`/therapist/clients${qs}`, {
    headers: authHeaders(token),
  });
}

export async function fetchClientTimeline(token: string, clientId: string) {
  return request<{ client: any; timeline: any[] }>(
    `/therapist/clients/${clientId}/timeline`,
    { headers: authHeaders(token) }
  );
}

export async function fetchTherapistPendingNotes(token: string) {
  return request<{ pendingBookings: any[] }>("/therapist/notes/pending", {
    headers: authHeaders(token),
  });
}

// ─── Therapy Notes API ────────────────────────────────────────────────────────

export async function createTherapyNote(
  token: string,
  data: {
    bookingId: string;
    sessionSummary?: string;
    keyThemes?: string[];
    emotionalState?: string;
    moodRating?: number;
    observations?: string;
    interventions?: string;
    actionItems?: string;
    nextSessionFocus?: string;
    internalNotes?: string;
    visibility?: string;
    tags?: { tag: string; category: string }[];
  }
) {
  return request<{ note: TherapyNote }>("/notes", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchNote(token: string, noteId: string) {
  return request<{ note: TherapyNote }>(`/notes/${noteId}`, {
    headers: authHeaders(token),
  });
}

export async function updateTherapyNote(
  token: string,
  noteId: string,
  data: Partial<{
    sessionSummary: string;
    keyThemes: string[];
    emotionalState: string;
    moodRating: number;
    observations: string;
    interventions: string;
    actionItems: string;
    nextSessionFocus: string;
    internalNotes: string;
    tags: { tag: string; category: string }[];
  }>
) {
  return request<{ note: TherapyNote }>(`/notes/${noteId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function updateNoteVisibility(
  token: string,
  noteId: string,
  visibility: "PRIVATE" | "SHARED" | "HOMEWORK"
) {
  return request<{ note: TherapyNote }>(`/notes/${noteId}/visibility`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ visibility }),
  });
}

export async function fetchBookingNotes(token: string, bookingId: string) {
  return request<{ note: TherapyNote | null }>(`/bookings/${bookingId}/notes`, {
    headers: authHeaders(token),
  });
}

// ─── Client Profile & Timeline API ───────────────────────────────────────────

export async function fetchMyProfile(token: string) {
  return request<{ profile: ClientProfile }>("/my-profile", {
    headers: authHeaders(token),
  });
}

export async function updateMyProfile(token: string, data: Partial<ClientProfile>) {
  return request<{ profile: ClientProfile }>("/my-profile", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchMyTimeline(token: string) {
  return request<{ timeline: TimelineEntry[] }>("/my-timeline", {
    headers: authHeaders(token),
  });
}

export async function fetchMyNotes(token: string) {
  return request<{ notes: TherapyNote[] }>("/my-notes", {
    headers: authHeaders(token),
  });
}

export async function fetchMyNote(token: string, noteId: string) {
  return request<{ note: TherapyNote }>(`/my-notes/${noteId}`, {
    headers: authHeaders(token),
  });
}

export async function fetchClientProfileForTherapist(token: string, clientId: string) {
  return request<{ client: any; profile: ClientProfile | null }>(
    `/therapist/clients/${clientId}/profile`,
    { headers: authHeaders(token) }
  );
}

// ─── Admin Therapist Management ───────────────────────────────────────────────

export async function createAdminTherapist(
  token: string,
  data: { email: string; name: string; password?: string; bio?: string; specializations?: string[]; qualifications?: string; licenseNumber?: string }
) {
  return request<{ user: User; profile: any }>("/admin/therapists", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchAdminTherapists(token: string) {
  return request<{ therapists: any[] }>("/admin/therapists", {
    headers: authHeaders(token),
  });
}

export async function updateAdminTherapist(
  token: string,
  id: string,
  data: { bio?: string; specializations?: string[]; qualifications?: string; licenseNumber?: string; isActive?: boolean; name?: string }
) {
  return request<{ therapist: any }>(`/admin/therapists/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function fetchAdminAnalytics(token: string) {
  return request<{ analytics: AnalyticsData }>("/admin/analytics", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminAuditLog(token: string, page?: number) {
  const qs = page ? `?page=${page}` : "";
  return request<{ logs: any[]; page: number; pageSize: number; total: number }>(
    `/admin/audit-log${qs}`,
    { headers: authHeaders(token) }
  );
}

// ─── Client Dashboard ─────────────────────────────────────────────────────────

export type ClientDashboardData = {
  upcomingBookings: {
    id: string;
    sessionTitle: string;
    sessionHost: string;
    startTime: string;
    tidycalUrl: string | null;
    zoomJoinUrl: string | null;
    zoomMeetingStatus: string | null;
    actualStartTime: string | null;
  }[];
  credits: {
    available: number;
    total: number;
    used: number;
    packages: {
      id: string;
      name: string;
      remaining: number;
      total: number;
    }[];
  };
  subscriptions: {
    id: string;
    sessionTitle: string;
    frequency: string;
    nextBillingAt: string;
    status: string;
  }[];
  journey: {
    completedSessions: number;
    sharedNotesCount: number;
    recentNotes: {
      id: string;
      sessionTitle: string;
      sessionDate: string;
      visibility: string;
      keyThemes: string[];
      moodRating: number | null;
    }[];
    moodTrend: {
      date: string;
      rating: number | null;
    }[];
  };
};

export async function fetchClientDashboard(token: string) {
  return request<ClientDashboardData>("/client/dashboard", {
    headers: authHeaders(token),
  });
}

export type ClientInvoice = {
  id: string;
  razorpayPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  sessionTitle: string | null;
  sessionHost: string | null;
  sessionDate: string | null;
  createdAt: string;
};

export async function fetchClientInvoices(token: string) {
  return request<{ invoices: ClientInvoice[] }>("/my-invoices", {
    headers: authHeaders(token),
  });
}

export type ClientNote = {
  id: string;
  visibility: string;
  sessionSummary?: string | null;
  actionItems?: string | null;
  nextSessionFocus?: string | null;
  interventions?: string | null;
  keyThemes?: string[];
  emotionalState?: string | null;
  moodRating?: number | null;
  sharedAt?: string | null;
  createdAt: string;
  booking?: { session?: { title?: string; startTime?: string } };
};

export async function fetchClientMyNotes(token: string) {
  return request<{ notes: ClientNote[] }>("/my-notes", {
    headers: authHeaders(token),
  });
}

// ─── Zoom Integration ─────────────────────────────────────────────────────────

export type ZoomMeeting = {
  id: string;
  zoomMeetingId: string;
  joinUrl: string;
  startUrl?: string;
  password?: string;
  status: string;
  recordings?: ZoomRecording[];
};

export type ZoomRecording = {
  id: string;
  recordingId: string;
  recordingType: string;
  fileType: string;
  fileSize?: number;
  downloadUrl?: string;
  transcriptText?: string;
  status: string;
};

export type ZoomConfigStatus = {
  configured: boolean;
  config?: {
    id: string;
    accountId: string;
    clientId: string;
    hasValidToken: boolean;
    updatedAt: string;
  };
};

export async function fetchZoomConfig(token: string) {
  return request<ZoomConfigStatus>("/admin/zoom/config", {
    headers: authHeaders(token),
  });
}

export async function saveZoomConfig(
  token: string,
  data: { accountId: string; clientId: string; clientSecret: string }
) {
  return request<{ success: boolean; config: any }>("/admin/zoom/config", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function testZoomConnection(token: string) {
  return request<{ success: boolean; error?: string }>("/admin/zoom/test", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function fetchBookingZoomMeeting(token: string, bookingId: string) {
  return request<{ meeting: ZoomMeeting | null }>(`/bookings/${bookingId}/zoom-meeting`, {
    headers: authHeaders(token),
  });
}

export async function createBookingZoomMeeting(token: string, bookingId: string) {
  return request<{ meeting: ZoomMeeting }>(`/bookings/${bookingId}/zoom-meeting`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function fetchBookingRecordings(token: string, bookingId: string) {
  return request<{ recordings: ZoomRecording[] }>(`/bookings/${bookingId}/recordings`, {
    headers: authHeaders(token),
  });
}

export async function syncBookingRecordings(token: string, bookingId: string) {
  return request<{ recordings: ZoomRecording[] }>(`/bookings/${bookingId}/sync-recordings`, {
    method: "POST",
    headers: authHeaders(token),
  });
}
