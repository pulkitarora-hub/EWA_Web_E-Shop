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
  fetchAdminTherapists,
  createAdminTherapist,
  fetchAdminAnalytics,
  AnalyticsData,
  fetchZoomConfig,
  saveZoomConfig,
  testZoomConnection,
  ZoomConfigStatus,
} from "../../lib/api";

type Props = { isAdmin: boolean; token: string };
type Tab = "overview" | "users" | "bookings" | "therapists" | "promos" | "analytics" | "zoom";

export function AdminDashboard({ isAdmin, token }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [showAddTherapist, setShowAddTherapist] = useState(false);
  const [newTherapist, setNewTherapist] = useState({ name: "", email: "", password: "", bio: "", qualifications: "" });
  const [promoCodes, setPromoCodes] = useState<PromoCodeType[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", type: "percentage" as "percentage" | "flat", value: "", maxUses: "", expiresAt: "" });
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zoomConfig, setZoomConfig] = useState<ZoomConfigStatus | null>(null);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [zoomForm, setZoomForm] = useState({ accountId: "", clientId: "", clientSecret: "" });
  const [zoomSaving, setZoomSaving] = useState(false);
  const [zoomTesting, setZoomTesting] = useState(false);
  const [zoomTestResult, setZoomTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => { loadOverview(); }, []);

  async function loadOverview() {
    setLoading(true);
    try {
      const [analyticsRes, bookingsRes] = await Promise.all([
        fetchAdminAnalytics(token), fetchAdminBookings(token),
      ]);
      setAnalytics(analyticsRes.analytics);
      setRecentBookings(bookingsRes.bookings.slice(0, 5));
    } catch (err) { console.error("Overview error:", err); }
    setLoading(false);
  }

  async function loadZoom() {
    setZoomLoading(true);
    try {
      const res = await fetchZoomConfig(token);
      setZoomConfig(res);
    } catch (err) { console.error("Zoom config error:", err); }
    setZoomLoading(false);
  }

  async function handleSaveZoomConfig() {
    if (!zoomForm.accountId || !zoomForm.clientId || !zoomForm.clientSecret) return;
    setZoomSaving(true);
    try {
      await saveZoomConfig(token, zoomForm);
      await loadZoom();
      setZoomForm({ accountId: "", clientId: "", clientSecret: "" });
    } catch (err) { console.error("Save zoom error:", err); }
    setZoomSaving(false);
  }

  async function handleTestZoom() {
    setZoomTesting(true);
    setZoomTestResult(null);
    try {
      const res = await testZoomConnection(token);
      setZoomTestResult(res);
    } catch (err: any) { setZoomTestResult({ success: false, error: err.message }); }
    setZoomTesting(false);
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await fetchAdminUsers(token, { search: userSearch || undefined, page: usersPage, pageSize: 20 });
      setUsers(res.users); setUsersTotal(res.total);
    } catch (err) { console.error("Users error:", err); }
    setUsersLoading(false);
  }

  async function loadBookings() {
    setBookingsLoading(true);
    try { const res = await fetchAdminBookings(token); setBookings(res.bookings); }
    catch (err) { console.error("Bookings error:", err); }
    setBookingsLoading(false);
  }

  async function loadTherapists() {
    setTherapistsLoading(true);
    try { const res = await fetchAdminTherapists(token); setTherapists(res.therapists); }
    catch (err) { console.error("Therapists error:", err); }
    setTherapistsLoading(false);
  }

  async function loadPromos() {
    setPromosLoading(true);
    try { const res = await fetchAdminPromoCodes(token); setPromoCodes(res.promoCodes); }
    catch (err) { console.error("Promos error:", err); }
    setPromosLoading(false);
  }

  async function handleViewUser(userId: string) {
    setDetailLoading(true);
    try { const res = await fetchAdminUserDetail(token, userId); setDetailUser(res); }
    catch (err) { console.error("User detail error:", err); }
    setDetailLoading(false);
  }

  async function handleCreateTherapist() {
    if (!newTherapist.name || !newTherapist.email) return;
    try {
      await createAdminTherapist(token, newTherapist);
      setShowAddTherapist(false);
      setNewTherapist({ name: "", email: "", password: "", bio: "", qualifications: "" });
      loadTherapists();
    } catch (err) { console.error("Create therapist error:", err); }
  }

  async function handleCreatePromo() {
    if (!promoForm.code || !promoForm.value) return;
    try {
      await createAdminPromoCode(token, {
        code: promoForm.code, type: promoForm.type, value: Number(promoForm.value),
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : undefined,
        expiresAt: promoForm.expiresAt || undefined,
      });
      setShowPromoForm(false);
      setPromoForm({ code: "", type: "percentage", value: "", maxUses: "", expiresAt: "" });
      loadPromos();
    } catch (err) { console.error("Create promo error:", err); }
  }

  async function handleTogglePromo(id: string, active: boolean) {
    await toggleAdminPromoCode(token, id, active); loadPromos();
  }

  async function handleDeletePromo(id: string) {
    if (!confirm("Delete this promo code?")) return;
    await deleteAdminPromoCode(token, id); loadPromos();
  }

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "bookings") loadBookings();
    if (activeTab === "therapists") loadTherapists();
    if (activeTab === "promos") loadPromos();
    if (activeTab === "analytics" && !analytics) loadOverview();
    if (activeTab === "zoom") loadZoom();
  }, [activeTab, usersPage, userSearch]);

  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" }, { key: "users", label: "Users" },
    { key: "bookings", label: "Bookings" }, { key: "therapists", label: "Therapists" },
    { key: "promos", label: "Promo Codes" }, { key: "analytics", label: "Analytics" },
    { key: "zoom", label: "Zoom" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{getGreeting()}, Admin</h1>
            <p className="text-slate-300 text-sm mt-1">Practice Administration</p>
          </div>
          {analytics && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-bold">{analytics.activeClients}</p>
                <p className="text-xs text-slate-400">Active Clients</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₹{((analytics.totalRevenue || 0) / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-400">Revenue</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? "bg-slate-800 text-white shadow-sm" : "text-warm-600 hover:bg-warm-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewContent analytics={analytics} recentBookings={recentBookings} loading={loading} onViewAllBookings={() => setActiveTab("bookings")} onViewAllUsers={() => setActiveTab("users")} />}
      {activeTab === "users" && <UsersContent users={users} loading={usersLoading} search={userSearch} onSearchChange={setUserSearch} page={usersPage} total={usersTotal} onPageChange={setUsersPage} onViewUser={handleViewUser} />}
      {activeTab === "bookings" && <BookingsContent bookings={bookings} loading={bookingsLoading} />}
      {activeTab === "therapists" && <TherapistsContent therapists={therapists} loading={therapistsLoading} showAdd={showAddTherapist} setShowAdd={setShowAddTherapist} newTherapist={newTherapist} setNewTherapist={setNewTherapist} onAdd={handleCreateTherapist} />}
      {activeTab === "promos" && <PromosContent promoCodes={promoCodes} loading={promosLoading} showForm={showPromoForm} setShowForm={setShowPromoForm} form={promoForm} setForm={setPromoForm} onCreate={handleCreatePromo} onToggle={handleTogglePromo} onDelete={handleDeletePromo} />}
      {activeTab === "analytics" && <AnalyticsContent analytics={analytics} loading={loading} />}
      {activeTab === "zoom" && <ZoomContent config={zoomConfig} loading={zoomLoading} form={zoomForm} setForm={setZoomForm} onSave={handleSaveZoomConfig} saving={zoomSaving} onTest={handleTestZoom} testing={zoomTesting} testResult={zoomTestResult} />}
      {detailUser && <UserDetailModal user={detailUser} loading={detailLoading} onClose={() => setDetailUser(null)} />}
    </div>
  );
}

function OverviewContent({ analytics, recentBookings, loading, onViewAllBookings, onViewAllUsers }: any) {
  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<BookingIcon />} value={analytics?.totalBookings || 0} label="Total Bookings" />
        <StatCard icon={<CheckIcon />} value={analytics?.paidBookings || 0} label="Paid Sessions" />
        <StatCard icon={<UsersIcon />} value={analytics?.activeClients || 0} label="Active Clients" />
        <StatCard icon={<TherapistIcon />} value={analytics?.therapistCount || 0} label="Therapists" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-100 flex items-center justify-between">
            <h2 className="font-semibold text-warm-900">Recent Bookings</h2>
            <button onClick={onViewAllBookings} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View All</button>
          </div>
          {recentBookings.length === 0 ? <div className="p-8 text-center text-warm-500">No bookings yet</div> : (
            <div className="divide-y divide-warm-100">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="p-4 flex items-center justify-between">
                  <div><p className="font-medium text-warm-900 text-sm">{b.user?.name || "User"}</p><p className="text-xs text-warm-500">{b.session?.title}</p></div>
                  <div className="text-right"><p className="text-sm font-medium text-warm-700">₹{b.amount}</p><StatusBadge status={b.status} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-warm-900 mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <MetricRow label="Completion Rate" value={`${analytics?.completionRate || 0}%`} color="brand" />
            <MetricRow label="Note Completion" value={`${analytics?.noteCompletionRate || 0}%`} color="green" />
            <MetricRow label="Total Revenue" value={`₹${(analytics?.totalRevenue || 0).toLocaleString()}`} color="amber" />
            <MetricRow label="Therapy Notes" value={analytics?.totalNotes || 0} color="blue" />
          </div>
          <button onClick={onViewAllUsers} className="w-full mt-4 py-2.5 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200 transition-colors">Manage Users</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-warm-200 p-5">
      <div className="w-10 h-10 bg-warm-100 rounded-lg flex items-center justify-center mb-3 text-warm-600">{icon}</div>
      <p className="text-2xl font-bold text-warm-900">{value}</p>
      <p className="text-sm text-warm-500 mt-0.5">{label}</p>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = { brand: "bg-brand-100 text-brand-700", green: "bg-green-100 text-green-700", amber: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700" };
  return (<div className="flex items-center justify-between"><span className="text-sm text-warm-600">{label}</span><span className={`text-sm font-medium px-3 py-1 rounded-full ${colors[color]}`}>{value}</span></div>);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { paid: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", cancelled: "bg-red-100 text-red-700" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || "bg-warm-100 text-warm-600"}`}>{status}</span>;
}

function UsersContent({ users, loading, search, onSearchChange, page, total, onPageChange, onViewUser }: any) {
  const totalPages = Math.ceil(total / 20);
  return (
    <div className="space-y-4">
      <div className="relative"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search users..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" /></div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin mx-auto" /></div> : users.length === 0 ? <div className="p-8 text-center text-warm-500">No users found</div> : (
          <>
            <table className="w-full">
              <thead className="bg-warm-50 text-left"><tr><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">User</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Role</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Status</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Joined</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-warm-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-warm-50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-sm font-medium">{(u.name || u.email || "?")[0].toUpperCase()}</div><div><p className="font-medium text-warm-900 text-sm">{u.name || "—"}</p><p className="text-xs text-warm-500">{u.email || u.phone}</p></div></div></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : u.role === "THERAPIST" ? "bg-blue-100 text-blue-700" : "bg-warm-100 text-warm-600"}`}>{u.role || "CLIENT"}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.onboardingComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{u.onboardingComplete ? "Active" : "Pending"}</span></td>
                    <td className="px-4 py-3 text-sm text-warm-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><button onClick={() => onViewUser(u.id)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && <div className="px-4 py-3 border-t border-warm-100 flex items-center justify-between"><p className="text-sm text-warm-500">Page {page} of {totalPages} ({total} users)</p><div className="flex gap-2"><button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-warm-200 text-sm disabled:opacity-50">Previous</button><button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-warm-200 text-sm disabled:opacity-50">Next</button></div></div>}
          </>
        )}
      </div>
    </div>
  );
}

function BookingsContent({ bookings, loading }: any) {
  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-warm-100"><h2 className="font-semibold text-warm-900">All Bookings ({bookings.length})</h2></div>
      {bookings.length === 0 ? <div className="p-8 text-center text-warm-500">No bookings yet</div> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-warm-50 text-left"><tr><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Client</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Session</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Date</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Amount</th><th className="px-4 py-3 text-xs font-semibold text-warm-600 uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-warm-100">
              {bookings.slice(0, 50).map((b: any) => (
                <tr key={b.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium text-warm-900 text-sm">{b.user?.name || "—"}</p><p className="text-xs text-warm-500">{b.user?.email}</p></td>
                  <td className="px-4 py-3 text-sm text-warm-700">{b.session?.title}</td>
                  <td className="px-4 py-3 text-sm text-warm-500">{b.session?.startTime ? new Date(b.session.startTime).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-warm-900">₹{b.amount}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TherapistsContent({ therapists, loading, showAdd, setShowAdd, newTherapist, setNewTherapist, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-semibold text-warm-900">Therapists ({therapists.length})</h2><button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">{showAdd ? "Cancel" : "+ Add Therapist"}</button></div>
      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name *" value={newTherapist.name} onChange={(e) => setNewTherapist({ ...newTherapist, name: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Email *" value={newTherapist.email} onChange={(e) => setNewTherapist({ ...newTherapist, email: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Password" type="password" value={newTherapist.password} onChange={(e) => setNewTherapist({ ...newTherapist, password: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Qualifications" value={newTherapist.qualifications} onChange={(e) => setNewTherapist({ ...newTherapist, qualifications: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <textarea placeholder="Bio" value={newTherapist.bio} onChange={(e) => setNewTherapist({ ...newTherapist, bio: e.target.value })} rows={2} className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          <button onClick={onAdd} disabled={!newTherapist.name || !newTherapist.email} className="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">Create Therapist</button>
        </div>
      )}
      {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div> : therapists.length === 0 ? <div className="bg-white rounded-xl p-12 text-center text-warm-500">No therapists yet</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-warm-100">
          {therapists.map((t: any) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-warm-50 transition-colors">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">{(t.name || "?")[0].toUpperCase()}</div><div><p className="font-medium text-warm-900">{t.name}</p><p className="text-sm text-warm-500">{t.email}</p>{t.therapistProfile?.qualifications && <p className="text-xs text-slate-400 mt-0.5">{t.therapistProfile.qualifications}</p>}</div></div>
              <div className="flex items-center gap-6"><div className="text-right"><p className="font-semibold text-brand-600">{t.stats?.sessionCount || 0} sessions</p><p className="text-xs text-warm-500">{t.stats?.clientCount || 0} clients</p></div><span className={`text-xs px-3 py-1 rounded-full ${t.therapistProfile?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.therapistProfile?.isActive ? "Active" : "Inactive"}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromosContent({ promoCodes, loading, showForm, setShowForm, form, setForm, onCreate, onToggle, onDelete }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-semibold text-warm-900">Promo Codes ({promoCodes.length})</h2><button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">{showForm ? "Cancel" : "+ Add Promo"}</button></div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"><option value="percentage">Percentage</option><option value="flat">Flat Amount</option></select>
            <input placeholder={form.type === "percentage" ? "Discount %" : "Amount (₹)"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Max Uses" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          <button onClick={onCreate} disabled={!form.code || !form.value} className="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">Create Promo</button>
        </div>
      )}
      {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div> : promoCodes.length === 0 ? <div className="bg-white rounded-xl p-12 text-center text-warm-500">No promo codes</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-warm-100">
          {promoCodes.map((p: any) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-warm-50 transition-colors">
              <div><p className="font-mono font-semibold text-warm-900">{p.code}</p><p className="text-sm text-warm-500">{p.type === "percentage" ? `${p.value}% off` : `₹${p.value} off`}{p.maxUses && ` · ${p.usedCount || 0}/${p.maxUses} uses`}</p></div>
              <div className="flex items-center gap-3"><button onClick={() => onToggle(p.id, !p.active)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-600"}`}>{p.active ? "Active" : "Inactive"}</button><button onClick={() => onDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsContent({ analytics, loading }: any) {
  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!analytics) return <div className="text-center py-16 text-warm-500">Unable to load analytics</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <StatCard icon={<BookingIcon />} value={analytics.totalBookings} label="Total Bookings" />
      <StatCard icon={<CheckIcon />} value={analytics.paidBookings} label="Paid Sessions" />
      <StatCard icon={<CloseIcon />} value={analytics.cancelledBookings} label="Cancelled" />
      <StatCard icon={<PercentIcon />} value={`${analytics.completionRate}%`} label="Completion Rate" />
      <StatCard icon={<MoneyIcon />} value={`₹${(analytics.totalRevenue || 0).toLocaleString()}`} label="Total Revenue" />
      <StatCard icon={<UsersIcon />} value={analytics.activeClients} label="Active Clients" />
      <StatCard icon={<NoteIcon />} value={analytics.totalNotes} label="Therapy Notes" />
      <StatCard icon={<PercentIcon />} value={`${analytics.noteCompletionRate}%`} label="Note Completion" />
      <StatCard icon={<TherapistIcon />} value={analytics.therapistCount} label="Therapists" />
    </div>
  );
}

function UserDetailModal({ user, loading, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between"><h3 className="font-semibold text-warm-900">User Details</h3><button onClick={onClose} className="text-slate-400 hover:text-warm-600"><CloseIcon /></button></div>
        {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin mx-auto" /></div> : (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4"><div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-2xl font-semibold">{(user.user?.name || user.user?.email || "?")[0].toUpperCase()}</div><div><p className="font-semibold text-warm-900 text-lg">{user.user?.name || "—"}</p><p className="text-warm-500">{user.user?.email}</p><p className="text-sm text-slate-400">{user.user?.phone}</p></div></div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-warm-100">
              <div><p className="text-xs text-slate-400 uppercase">Role</p><p className="font-medium text-warm-900">{user.user?.role || "CLIENT"}</p></div>
              <div><p className="text-xs text-slate-400 uppercase">Status</p><p className="font-medium text-warm-900">{user.user?.onboardingComplete ? "Active" : "Pending"}</p></div>
              <div><p className="text-xs text-slate-400 uppercase">Bookings</p><p className="font-medium text-warm-900">{user.bookings?.length || 0}</p></div>
              <div><p className="text-xs text-slate-400 uppercase">Joined</p><p className="font-medium text-warm-900">{user.user?.createdAt ? new Date(user.user.createdAt).toLocaleDateString() : "—"}</p></div>
            </div>
            {user.user?.goal && <div className="pt-4 border-t border-warm-100"><p className="text-xs text-slate-400 uppercase mb-1">Goal</p><p className="text-warm-700 text-sm">{user.user.goal}</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function ZoomContent({ config, loading, form, setForm, onSave, saving, onTest, testing, testResult }: any) {
  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-warm-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin.replace(/:\d+$/, ":4000")}/zoom/webhook`
    : "/zoom/webhook";

  return (
    <div className="space-y-6">
      {/* Current Config Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-warm-900 mb-4">Zoom Integration Status</h3>
        {config?.configured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-warm-900">Zoom Connected</p>
                <p className="text-sm text-warm-500">Account ID: {config.config.accountId}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-warm-100">
              <div>
                <p className="text-xs text-warm-400 uppercase mb-1">Client ID</p>
                <p className="text-warm-700 font-mono text-sm">{config.config.clientId}</p>
              </div>
              <div>
                <p className="text-xs text-warm-400 uppercase mb-1">Token Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.config.hasValidToken ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {config.config.hasValidToken ? "Valid" : "Expired/None"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-warm-100">
              <button
                onClick={onTest}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Testing...</>
                ) : (
                  "Test Connection"
                )}
              </button>
              {testResult && (
                <span className={`text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                  {testResult.success ? "Connection successful!" : testResult.error || "Connection failed"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-warm-50 rounded-lg">
            <ZoomIcon className="w-12 h-12 mx-auto text-warm-300 mb-3" />
            <p className="text-warm-600">Zoom integration not configured</p>
            <p className="text-warm-500 text-sm mt-1">Add your credentials below to enable Zoom meetings</p>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-warm-900 mb-4">{config?.configured ? "Update Credentials" : "Configure Zoom"}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Account ID</label>
            <input
              type="text"
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              placeholder="Your Zoom Account ID"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Client ID</label>
            <input
              type="text"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              placeholder="Your Zoom Client ID"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">Client Secret</label>
            <input
              type="password"
              value={form.clientSecret}
              onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              placeholder="Your Zoom Client Secret"
              className="w-full rounded-lg border border-warm-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={onSave}
            disabled={saving || !form.accountId || !form.clientId || !form.clientSecret}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              config?.configured ? "Update Configuration" : "Save Configuration"
            )}
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-warm-900 mb-4">Webhook Configuration</h3>
        <p className="text-sm text-warm-600 mb-3">
          Add this webhook URL to your Zoom Server-to-Server OAuth app to receive meeting events:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-warm-100 px-4 py-2.5 rounded-lg text-sm text-warm-700 font-mono overflow-auto">
            {webhookUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(webhookUrl)}
            className="px-4 py-2.5 bg-warm-200 text-warm-700 rounded-lg hover:bg-warm-300 transition-colors text-sm"
          >
            Copy
          </button>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Required Webhook Events:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>&bull; meeting.started - Track when meetings begin</li>
            <li>&bull; meeting.ended - Track when meetings end</li>
            <li>&bull; recording.completed - Import cloud recordings</li>
            <li>&bull; recording.transcript_completed - Import transcripts</li>
          </ul>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-warm-900 mb-4">Setup Instructions</h3>
        <ol className="space-y-3 text-sm text-warm-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
            <span>Go to <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Zoom Marketplace</a> and sign in</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
            <span>Click "Develop" → "Build App" → "Server-to-Server OAuth"</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
            <span>Add scopes: meeting:write:meeting:admin, meeting:read:meeting:admin, cloud_recording:read:list_recording_files:admin</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
            <span>Copy Account ID, Client ID, and Client Secret</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
            <span>Enable webhooks and add the webhook URL from above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">6</span>
            <span>Activate the app and paste credentials above</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function ZoomIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h16v14H4V5zm2 2v10h12V7H6zm2 2h8v6H8V9z"/>
    </svg>
  );
}

function BookingIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function CheckIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>; }
function UsersIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function TherapistIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function NoteIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function SearchIcon({ className = "w-5 h-5" }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function CloseIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>; }
function PercentIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>; }
function MoneyIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
