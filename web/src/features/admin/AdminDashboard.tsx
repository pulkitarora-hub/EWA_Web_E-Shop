import React, { useEffect, useState } from "react";
import {
  fetchAdminBookings,
  fetchAdminPayments,
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateAdminUser,
  bulkUpdateAdminUsers,
  fetchAdminReviews,
  fetchAdminPromoCodes,
  createAdminPromoCode,
  toggleAdminPromoCode,
  deleteAdminPromoCode,
  PromoCodeType,
} from "../../lib/api";

type Props = {
  isAdmin: boolean;
  token: string;
};

type Tab = "users" | "bookings" | "payments" | "reviews" | "promos";

export function AdminDashboard({ isAdmin, token }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(25);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSortBy, setUsersSortBy] = useState<"createdAt" | "name">("createdAt");
  const [usersSortDir, setUsersSortDir] = useState<"asc" | "desc">("desc");
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeType[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [reviewsQuery, setReviewsQuery] = useState("");
  const [reviewsRating, setReviewsRating] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [reviewsParams, setReviewsParams] = useState({ search: "", rating: "all" as "all" | "5" | "4" | "3" | "2" | "1" });

  const [userQuery, setUserQuery] = useState("");
  const [userFilterAdmin, setUserFilterAdmin] = useState<"all" | "admin" | "user">("all");
  const [userFilterOnboarded, setUserFilterOnboarded] = useState<"all" | "yes" | "no">("all");
  const [userFilterStartDate, setUserFilterStartDate] = useState("");
  const [userFilterEndDate, setUserFilterEndDate] = useState("");
  const [userParams, setUserParams] = useState({
    search: "",
    isAdmin: "all" as "all" | "admin" | "user",
    onboarding: "all" as "all" | "yes" | "no",
    startDate: "",
    endDate: "",
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    onboardingComplete: false,
    isAdmin: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<
    "set_admin" | "remove_admin" | "mark_onboarded" | "mark_not_onboarded" | ""
  >("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);

  // Promo form state
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "", type: "percentage" as "percentage" | "flat", value: "", maxUses: "", minAmount: "", expiresAt: "",
  });
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      fetchAdminBookings(token).then((res) => setBookings(res.bookings)),
      fetchAdminPayments(token).then((res) => setPayments(res.payments)),
      fetchAdminPromoCodes(token).then((res) => setPromoCodes(res.promoCodes)),
    ]).finally(() => setLoading(false));
  }, [isAdmin, token]);

  useEffect(() => {
    if (!isAdmin) return;
    setUsersLoading(true);
    setUsersError(null);
    setBulkMessage(null);
    fetchAdminUsers(token, {
      search: userParams.search || undefined,
      isAdmin:
        userParams.isAdmin === "all" ? "all" : userParams.isAdmin === "admin",
      onboardingComplete:
        userParams.onboarding === "all" ? "all" : userParams.onboarding === "yes",
      page: usersPage,
      pageSize: usersPageSize,
      sortBy: usersSortBy,
      sortDir: usersSortDir,
      startDate: userParams.startDate || undefined,
      endDate: userParams.endDate || undefined,
    })
      .then((res) => {
        setUsers(res.users);
        setUsersTotal(res.total);
        setSelectedUserIds([]);
      })
      .catch((err: any) => setUsersError(err.message || "Failed to load users."))
      .finally(() => setUsersLoading(false));
  }, [isAdmin, token, userParams, usersPage, usersPageSize, usersSortBy, usersSortDir]);

  useEffect(() => {
    if (!isAdmin) return;
    setReviewsLoading(true);
    setReviewsError(null);
    fetchAdminReviews(token, {
      search: reviewsParams.search || undefined,
      rating: reviewsParams.rating === "all" ? undefined : Number(reviewsParams.rating),
    })
      .then((res) => setReviews(res.reviews))
      .catch((err: any) => setReviewsError(err.message || "Failed to load reviews."))
      .finally(() => setReviewsLoading(false));
  }, [isAdmin, token, reviewsParams]);

  async function handleCreatePromo() {
    setPromoError(null);
    if (!promoForm.code || !promoForm.value) {
      setPromoError("Code and value are required.");
      return;
    }
    try {
      const res = await createAdminPromoCode(token, {
        code: promoForm.code,
        type: promoForm.type,
        value: Number(promoForm.value),
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : undefined,
        minAmount: promoForm.minAmount ? Number(promoForm.minAmount) : undefined,
        expiresAt: promoForm.expiresAt || undefined,
      });
      setPromoCodes((prev) => [res.promoCode, ...prev]);
      setShowPromoForm(false);
      setPromoForm({ code: "", type: "percentage", value: "", maxUses: "", minAmount: "", expiresAt: "" });
    } catch (err: any) {
      setPromoError(err.message || "Failed to create.");
    }
  }

  async function handleTogglePromo(id: string, active: boolean) {
    const res = await toggleAdminPromoCode(token, id, active);
    setPromoCodes((prev) => prev.map((p) => (p.id === id ? res.promoCode : p)));
  }

  async function handleDeletePromo(id: string) {
    await deleteAdminPromoCode(token, id);
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
  }

  function handleApplyUserFilters() {
    setUsersPage(1);
    setUserParams({
      search: userQuery.trim(),
      isAdmin: userFilterAdmin,
      onboarding: userFilterOnboarded,
      startDate: userFilterStartDate,
      endDate: userFilterEndDate,
    });
  }

  function handleResetUserFilters() {
    setUserQuery("");
    setUserFilterAdmin("all");
    setUserFilterOnboarded("all");
    setUserFilterStartDate("");
    setUserFilterEndDate("");
    setUsersPage(1);
    setUserParams({ search: "", isAdmin: "all", onboarding: "all", startDate: "", endDate: "" });
  }

  function handleApplyReviewFilters() {
    setReviewsParams({
      search: reviewsQuery.trim(),
      rating: reviewsRating,
    });
  }

  function handleResetReviewFilters() {
    setReviewsQuery("");
    setReviewsRating("all");
    setReviewsParams({ search: "", rating: "all" });
  }

  function handleStartEdit(user: any) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      goal: user.goal || "",
      onboardingComplete: Boolean(user.onboardingComplete),
      isAdmin: Boolean(user.isAdmin),
    });
    setEditError(null);
  }

  async function handleSaveUser() {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await updateAdminUser(token, editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        goal: editForm.goal,
        onboardingComplete: editForm.onboardingComplete,
        isAdmin: editForm.isAdmin,
      });
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      if (detailData?.user?.id === res.user.id) {
        setDetailData((prev: any) => (prev ? { ...prev, user: res.user } : prev));
      }
      setEditingUser(res.user);
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  }

  function toggleSelectedUser(id: string) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
      return;
    }
    setSelectedUserIds(users.map((u) => u.id));
  }

  async function handleApplyBulkAction() {
    if (!bulkAction || selectedUserIds.length === 0) return;
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const res = await bulkUpdateAdminUsers(token, {
        ids: selectedUserIds,
        action: bulkAction,
      });
      setBulkMessage(`Updated ${res.updatedCount} user(s).`);
      setUsersPage(1);
      setUserParams((prev) => ({ ...prev }));
    } catch (err: any) {
      setBulkMessage(err.message || "Bulk action failed.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleViewDetails(id: string) {
    setDetailUserId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetchAdminUserDetail(token, id);
      setDetailData(res);
    } catch (err: any) {
      setDetailError(err.message || "Failed to load user details.");
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (!isAdmin) return null;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "users", label: "Users", count: users.length },
    { key: "bookings", label: "Bookings", count: bookings.length },
    { key: "payments", label: "Payments", count: payments.length },
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "promos", label: "Promo Codes", count: promoCodes.length },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          Admin Dashboard
        </h2>
        <p className="text-sm text-charcoal-lighter mt-1">
          Manage users, bookings, and payments
        </p>
      </div>

      {/* Tabs – dark style */}
      <div className="flex gap-1 mb-6 bg-deep rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow-sm"
                : "text-white/50 hover:text-white/80 hover:bg-deep-light"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-deep-light text-white/40"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
          <p className="text-charcoal-lighter text-sm mt-3">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-200 overflow-hidden shadow-sm">
          {/* Users Table */}
          {activeTab === "users" && (
            <div>
              <div className="p-4 border-b border-warm-100 bg-warm-50/40">
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search name, email, phone, referral code"
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm min-w-[220px]"
                  />
                  <select
                    value={userFilterAdmin}
                    onChange={(e) => setUserFilterAdmin(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  >
                    <option value="all">All roles</option>
                    <option value="admin">Admins only</option>
                    <option value="user">Non-admins</option>
                  </select>
                  <select
                    value={userFilterOnboarded}
                    onChange={(e) => setUserFilterOnboarded(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  >
                    <option value="all">All onboarding</option>
                    <option value="yes">Onboarded</option>
                    <option value="no">Not onboarded</option>
                  </select>
                  <input
                    value={userFilterStartDate}
                    onChange={(e) => setUserFilterStartDate(e.target.value)}
                    type="date"
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  />
                  <input
                    value={userFilterEndDate}
                    onChange={(e) => setUserFilterEndDate(e.target.value)}
                    type="date"
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  />
                  <select
                    value={usersSortBy}
                    onChange={(e) => setUsersSortBy(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  >
                    <option value="createdAt">Sort by joined</option>
                    <option value="name">Sort by name</option>
                  </select>
                  <select
                    value={usersSortDir}
                    onChange={(e) => setUsersSortDir(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                  <button
                    onClick={handleApplyUserFilters}
                    className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleResetUserFilters}
                    className="px-3 py-2 border border-warm-300 text-xs font-semibold rounded-lg transition hover:bg-warm-100"
                  >
                    Reset
                  </button>
                </div>
                {usersError && <p className="text-xs text-red-500 mt-2">{usersError}</p>}
              </div>

              <div className="p-4 border-b border-warm-100 flex flex-wrap items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                >
                  <option value="">Bulk actions</option>
                  <option value="set_admin">Grant admin</option>
                  <option value="remove_admin">Remove admin</option>
                  <option value="mark_onboarded">Mark onboarded</option>
                  <option value="mark_not_onboarded">Mark not onboarded</option>
                </select>
                <button
                  onClick={handleApplyBulkAction}
                  disabled={bulkLoading || !bulkAction || selectedUserIds.length === 0}
                  className="px-3 py-2 bg-deep text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {bulkLoading ? "Applying..." : `Apply to ${selectedUserIds.length || 0}`}
                </button>
                {bulkMessage && <span className="text-xs text-charcoal-lighter">{bulkMessage}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-charcoal-lighter">
                    {usersTotal} total
                  </span>
                  <select
                    value={usersPageSize}
                    onChange={(e) => {
                      setUsersPageSize(Number(e.target.value));
                      setUsersPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-warm-300 text-xs"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>

              {editingUser && (
                <div className="p-4 border-b border-warm-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal">Edit user</p>
                      <p className="text-xs text-charcoal-lighter">{editingUser.id}</p>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={editForm.goal}
                      onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                      placeholder="Goal"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <label className="flex items-center gap-2 text-xs text-charcoal-light">
                      <input
                        type="checkbox"
                        checked={editForm.onboardingComplete}
                        onChange={(e) => setEditForm({ ...editForm, onboardingComplete: e.target.checked })}
                      />
                      Onboarding complete
                    </label>
                    <label className="flex items-center gap-2 text-xs text-charcoal-light">
                      <input
                        type="checkbox"
                        checked={editForm.isAdmin}
                        onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                      />
                      Admin access
                    </label>
                  </div>
                  {editError && <p className="text-xs text-red-500 mb-2">{editError}</p>}
                  <button
                    onClick={handleSaveUser}
                    disabled={editSaving}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    {editSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}

              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
                  <p className="text-charcoal-lighter text-sm mt-3">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-deep text-left">
                        <th className="px-4 py-3 font-medium text-white/70">
                          <input
                            type="checkbox"
                            checked={users.length > 0 && selectedUserIds.length === users.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium text-white/70">Name</th>
                        <th className="px-4 py-3 font-medium text-white/70">Phone</th>
                        <th className="px-4 py-3 font-medium text-white/70">Email</th>
                        <th className="px-4 py-3 font-medium text-white/70">Role</th>
                        <th className="px-4 py-3 font-medium text-white/70">Onboarded</th>
                        <th className="px-4 py-3 font-medium text-white/70">Joined</th>
                        <th className="px-4 py-3 font-medium text-white/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-warm-50/50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={() => toggleSelectedUser(u.id)}
                            />
                          </td>
                          <td className="px-4 py-3 text-charcoal font-medium">{u.name || "—"}</td>
                          <td className="px-4 py-3 text-charcoal-light">{u.phone || "—"}</td>
                          <td className="px-4 py-3 text-charcoal-light">{u.email || "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                                u.isAdmin ? "bg-brand-100 text-brand-700" : "bg-warm-100 text-charcoal-lighter"
                              }`}
                            >
                              {u.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.onboardingComplete ? (
                              <span className="inline-flex items-center gap-1 text-sage-600 text-xs font-medium bg-sage-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs text-charcoal-lighter">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-charcoal-lighter text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(u.id)}
                                className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleStartEdit(u)}
                                className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-8 text-charcoal-lighter text-sm">No users yet.</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-3 border-t border-warm-100">
                <span className="text-xs text-charcoal-lighter">
                  Page {usersPage} of {Math.max(1, Math.ceil(usersTotal / usersPageSize))}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage <= 1}
                    className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setUsersPage((p) =>
                        p >= Math.ceil(usersTotal / usersPageSize) ? p : p + 1
                      )
                    }
                    disabled={usersPage >= Math.ceil(usersTotal / usersPageSize)}
                    className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {detailUserId && (
                <div className="p-4 border-t border-warm-100 bg-warm-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal">User details</p>
                      <p className="text-xs text-charcoal-lighter">{detailUserId}</p>
                    </div>
                    <button
                      onClick={() => {
                        setDetailUserId(null);
                        setDetailData(null);
                        setDetailError(null);
                      }}
                      className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  {detailLoading ? (
                    <div className="text-xs text-charcoal-lighter">Loading details...</div>
                  ) : detailError ? (
                    <div className="text-xs text-red-500">{detailError}</div>
                  ) : detailData ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">Profile</p>
                        <div className="space-y-1 text-xs">
                          <div>Name: {detailData.user.name || "—"}</div>
                          <div>Email: {detailData.user.email || "—"}</div>
                          <div>Phone: {detailData.user.phone || "—"}</div>
                          <div>Goal: {detailData.user.goal || "—"}</div>
                          <div>Role: {detailData.user.isAdmin ? "Admin" : "User"}</div>
                          <div>
                            Joined:{" "}
                            {detailData.user.createdAt
                              ? new Date(detailData.user.createdAt).toLocaleDateString("en-IN")
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">Audit log</p>
                        {detailData.auditLogs.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No audit entries.</div>
                        ) : (
                          <div className="space-y-2 text-xs">
                            {detailData.auditLogs.map((log: any) => (
                              <div key={log.id} className="border-b border-warm-100 pb-2">
                                <div className="text-charcoal">
                                  {log.action} by {log.adminUser?.name || log.adminUser?.phone || "Admin"}
                                </div>
                                <div className="text-charcoal-lighter">
                                  {new Date(log.createdAt).toLocaleString("en-IN")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">
                          Recent bookings ({detailData.bookings.length})
                        </p>
                        {detailData.bookings.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No bookings.</div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {detailData.bookings.map((b: any) => (
                              <div key={b.id}>
                                {b.session?.title || "Session"} • {b.status} •{" "}
                                {new Date(b.createdAt).toLocaleDateString("en-IN")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">
                          Packages ({detailData.userPackages.length})
                        </p>
                        {detailData.userPackages.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No packages.</div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {detailData.userPackages.map((p: any) => (
                              <div key={p.id}>
                                {p.package?.name || "Package"} • {p.status} •{" "}
                                {new Date(p.createdAt).toLocaleDateString("en-IN")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">
                          Subscriptions ({detailData.subscriptions.length})
                        </p>
                        {detailData.subscriptions.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No subscriptions.</div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {detailData.subscriptions.map((s: any) => (
                              <div key={s.id}>
                                {s.sessionTitle} • {s.status} •{" "}
                                {new Date(s.createdAt).toLocaleDateString("en-IN")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">
                          Payments ({detailData.payments.length})
                        </p>
                        {detailData.payments.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No payments.</div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {detailData.payments.map((p: any) => (
                              <div key={p.id}>
                                {p.status} • {p.razorpayPaymentId} •{" "}
                                {new Date(p.createdAt).toLocaleDateString("en-IN")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-warm-200 p-3">
                        <p className="text-xs text-charcoal-lighter mb-2">
                          Referrals (made {detailData.referralsMade.length} / received{" "}
                          {detailData.referralsReceived.length})
                        </p>
                        {detailData.referralsMade.length === 0 &&
                        detailData.referralsReceived.length === 0 ? (
                          <div className="text-xs text-charcoal-lighter">No referrals.</div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {detailData.referralsMade.map((r: any) => (
                              <div key={r.id}>
                                Referred {r.referee?.name || r.referee?.phone || "User"} •{" "}
                                {r.status}
                              </div>
                            ))}
                            {detailData.referralsReceived.map((r: any) => (
                              <div key={r.id}>
                                Referred by {r.referrer?.name || r.referrer?.phone || "User"} •{" "}
                                {r.status}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Bookings Table */}
          {activeTab === "bookings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep text-left">
                    <th className="px-4 py-3 font-medium text-white/70">Client</th>
                    <th className="px-4 py-3 font-medium text-white/70">Session</th>
                    <th className="px-4 py-3 font-medium text-white/70">Amount</th>
                    <th className="px-4 py-3 font-medium text-white/70">Status</th>
                    <th className="px-4 py-3 font-medium text-white/70">Policy</th>
                    <th className="px-4 py-3 font-medium text-white/70">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3 text-charcoal font-medium">
                        {b.user?.name || b.user?.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light">
                        {b.session?.title || b.sessionId}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light">
                        {b.currency} {b.amount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            b.status === "paid"
                              ? "bg-sage-50 text-sage-700"
                              : b.status === "pending"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-warm-100 text-charcoal-lighter"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.policyAgreedAt ? (
                          <span className="inline-flex items-center gap-1 text-sage-600 text-xs font-medium bg-sage-50 px-2 py-0.5 rounded-full" title={`Signed by: ${b.policySignedName || "—"}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Signed
                          </span>
                        ) : (
                          <span className="text-xs text-charcoal-lighter">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-charcoal-lighter text-xs">
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="text-center py-8 text-charcoal-lighter text-sm">No bookings yet.</div>
              )}
            </div>
          )}

          {/* Payments Table */}
          {activeTab === "payments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep text-left">
                    <th className="px-4 py-3 font-medium text-white/70">Client</th>
                    <th className="px-4 py-3 font-medium text-white/70">Payment ID</th>
                    <th className="px-4 py-3 font-medium text-white/70">Status</th>
                    <th className="px-4 py-3 font-medium text-white/70">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-warm-50/50">
                      <td className="px-4 py-3 text-charcoal font-medium">
                        {p.user?.name || p.user?.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-charcoal-light font-mono text-xs">
                        {p.razorpayPaymentId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "captured"
                              ? "bg-sage-50 text-sage-700"
                              : "bg-warm-100 text-charcoal-lighter"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal-lighter text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="text-center py-8 text-charcoal-lighter text-sm">No payments yet.</div>
              )}
            </div>
          )}

          {/* Reviews Table */}
          {activeTab === "reviews" && (
            <div>
              <div className="p-4 border-b border-warm-100 bg-warm-50/40">
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={reviewsQuery}
                    onChange={(e) => setReviewsQuery(e.target.value)}
                    placeholder="Search comment, session, or user"
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm min-w-[220px]"
                  />
                  <select
                    value={reviewsRating}
                    onChange={(e) => setReviewsRating(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                  >
                    <option value="all">All ratings</option>
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </select>
                  <button
                    onClick={handleApplyReviewFilters}
                    className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleResetReviewFilters}
                    className="px-3 py-2 border border-warm-300 text-xs font-semibold rounded-lg transition hover:bg-warm-100"
                  >
                    Reset
                  </button>
                </div>
                {reviewsError && <p className="text-xs text-red-500 mt-2">{reviewsError}</p>}
              </div>

              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
                  <p className="text-charcoal-lighter text-sm mt-3">Loading reviews...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-deep text-left">
                        <th className="px-4 py-3 font-medium text-white/70">User</th>
                        <th className="px-4 py-3 font-medium text-white/70">Session</th>
                        <th className="px-4 py-3 font-medium text-white/70">Rating</th>
                        <th className="px-4 py-3 font-medium text-white/70">Comment</th>
                        <th className="px-4 py-3 font-medium text-white/70">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {reviews.map((r) => (
                        <tr key={r.id} className="hover:bg-warm-50/50">
                          <td className="px-4 py-3 text-charcoal font-medium">
                            {r.user?.name || r.user?.phone || "—"}
                          </td>
                          <td className="px-4 py-3 text-charcoal-light">
                            {r.session?.title || "—"}
                          </td>
                          <td className="px-4 py-3 text-charcoal-light">{r.rating} / 5</td>
                          <td className="px-4 py-3 text-charcoal-light">
                            {r.comment || "—"}
                          </td>
                          <td className="px-4 py-3 text-charcoal-lighter text-xs">
                            {new Date(r.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reviews.length === 0 && (
                    <div className="text-center py-8 text-charcoal-lighter text-sm">No reviews yet.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Promo Codes Management */}
          {activeTab === "promos" && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal">Promo Codes</h3>
                <button
                  onClick={() => setShowPromoForm(!showPromoForm)}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  {showPromoForm ? "Cancel" : "+ New Code"}
                </button>
              </div>

              {showPromoForm && (
                <div className="bg-warm-50 rounded-xl p-4 mb-4 border border-warm-200">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="Code (e.g. SAVE20)"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm uppercase"
                    />
                    <select
                      value={promoForm.type}
                      onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as any })}
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (INR)</option>
                    </select>
                    <input
                      value={promoForm.value}
                      onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                      placeholder={promoForm.type === "percentage" ? "Discount %" : "Discount INR"}
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                      placeholder="Max uses (optional)"
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.minAmount}
                      onChange={(e) => setPromoForm({ ...promoForm, minAmount: e.target.value })}
                      placeholder="Min amount (optional)"
                      type="number"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                    <input
                      value={promoForm.expiresAt}
                      onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                      placeholder="Expiry date"
                      type="date"
                      className="px-3 py-2 rounded-lg border border-warm-300 text-sm"
                    />
                  </div>
                  {promoError && <p className="text-xs text-red-500 mb-2">{promoError}</p>}
                  <button
                    onClick={handleCreatePromo}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Create Promo Code
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-deep text-left">
                      <th className="px-4 py-3 font-medium text-white/70">Code</th>
                      <th className="px-4 py-3 font-medium text-white/70">Discount</th>
                      <th className="px-4 py-3 font-medium text-white/70">Usage</th>
                      <th className="px-4 py-3 font-medium text-white/70">Status</th>
                      <th className="px-4 py-3 font-medium text-white/70">Expires</th>
                      <th className="px-4 py-3 font-medium text-white/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {promoCodes.map((p) => (
                      <tr key={p.id} className="hover:bg-warm-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-brand-700">{p.code}</td>
                        <td className="px-4 py-3 text-charcoal-light">
                          {p.type === "percentage" ? `${p.value}%` : `INR ${p.value}`}
                        </td>
                        <td className="px-4 py-3 text-charcoal-light">
                          {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.active ? "bg-sage-50 text-sage-700" : "bg-red-50 text-red-600"
                          }`}>
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-charcoal-lighter text-xs">
                          {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleTogglePromo(p.id, !p.active)}
                              className="text-xs px-2 py-1 rounded border border-warm-300 hover:bg-warm-100 transition-colors"
                            >
                              {p.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {promoCodes.length === 0 && (
                  <div className="text-center py-8 text-charcoal-lighter text-sm">No promo codes yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
