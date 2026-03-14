import React, { useEffect, useState } from "react";
import {
  fetchTherapistDashboard,
  fetchTherapistClients,
  fetchTherapistPendingNotes,
  TherapistClient,
} from "../../lib/api";
import { NoteEditor } from "./NoteEditor";
import { ClientTimeline } from "./ClientTimeline";

type Tab = "overview" | "clients" | "pending";

type Props = {
  token: string;
  userName: string;
};

export function TherapistDashboard({ token, userName }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [clients, setClients] = useState<TherapistClient[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<TherapistClient | null>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await fetchTherapistDashboard(token);
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
    setLoading(false);
  }

  async function loadClients() {
    try {
      const data = await fetchTherapistClients(token, clientSearch ? clientSearch : undefined);
      setClients(data.clients);
    } catch (err) {
      console.error("Clients load error:", err);
    }
  }

  async function loadPending() {
    try {
      const data = await fetchTherapistPendingNotes(token);
      setPendingBookings(data.pendingBookings);
    } catch (err) {
      console.error("Pending notes error:", err);
    }
  }

  useEffect(() => {
    if (tab === "clients") loadClients();
    if (tab === "pending") loadPending();
  }, [tab, clientSearch]);

  function handleAddNote(bookingId: string, clientName?: string) {
    setEditingBookingId(bookingId);
    setEditingClientName(clientName || "Client");
  }

  if (editingBookingId) {
    return (
      <NoteEditor
        token={token}
        bookingId={editingBookingId}
        clientName={editingClientName}
        onBack={() => {
          setEditingBookingId(null);
          setEditingClientName("");
          loadDashboard();
          loadPending();
        }}
      />
    );
  }

  if (selectedClient) {
    return (
      <ClientTimeline
        token={token}
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onAddNote={(bookingId) => handleAddNote(bookingId, selectedClient.name || undefined)}
      />
    );
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "clients", label: "Clients" },
    { key: "pending", label: `Pending Notes${dashboard?.pendingNotesCount > 0 ? ` (${dashboard.pendingNotesCount})` : ""}` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{getGreeting()}, {userName}</h1>
            <p className="text-brand-100 text-sm mt-1">Therapist Dashboard</p>
          </div>
          {dashboard?.pendingNotesCount > 0 && (
            <button
              onClick={() => setTab("pending")}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              {dashboard.pendingNotesCount} notes pending
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-brand-500 text-white shadow-sm"
                : "text-warm-600 hover:bg-warm-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <OverviewTab
          dashboard={dashboard}
          loading={loading}
          onAddNote={handleAddNote}
          onViewPending={() => setTab("pending")}
        />
      )}

      {tab === "clients" && (
        <ClientsTab
          clients={clients}
          search={clientSearch}
          onSearchChange={setClientSearch}
          onSelectClient={setSelectedClient}
        />
      )}

      {tab === "pending" && (
        <PendingTab
          bookings={pendingBookings}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
}

function OverviewTab({
  dashboard,
  loading,
  onAddNote,
  onViewPending,
}: {
  dashboard: any;
  loading: boolean;
  onAddNote: (id: string, name?: string) => void;
  onViewPending: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-16 text-warm-500">Unable to load dashboard data</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarIcon />}
          value={dashboard.todaySessions?.length || 0}
          label="Today's Sessions"
        />
        <StatCard
          icon={<ClockIcon />}
          value={dashboard.upcomingSessions?.length || 0}
          label="Upcoming"
        />
        <StatCard
          icon={<UsersIcon />}
          value={dashboard.totalClients || 0}
          label="Total Clients"
        />
        <StatCard
          icon={<NoteIcon />}
          value={dashboard.pendingNotesCount || 0}
          label="Pending Notes"
          highlight={dashboard.pendingNotesCount > 0}
          onClick={dashboard.pendingNotesCount > 0 ? onViewPending : undefined}
        />
      </div>

      {/* Pending Notes Alert */}
      {dashboard.pendingNotesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <NoteIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">
                {dashboard.pendingNotesCount} session{dashboard.pendingNotesCount !== 1 ? "s" : ""} need notes
              </p>
              <p className="text-sm text-amber-700">Complete your documentation to maintain client records</p>
            </div>
          </div>
          <button
            onClick={onViewPending}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Complete Notes
          </button>
        </div>
      )}

      {/* Today's Sessions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-warm-100">
          <h2 className="font-semibold text-warm-900">Today's Sessions</h2>
        </div>
        {!dashboard.todaySessions?.length ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-warm-400" />
            </div>
            <p className="text-warm-500">No sessions scheduled for today</p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {dashboard.todaySessions.map((b: any) => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-warm-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-semibold">
                    {(b.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-warm-900">{b.user?.name || "Client"}</p>
                    <p className="text-sm text-warm-500">
                      {b.session.title} &middot;{" "}
                      {new Date(b.session.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.zoomMeeting?.startUrl && (
                    <a
                      href={b.zoomMeeting.startUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h16v14H4V5zm2 2v10h12V7H6zm2 2h8v6H8V9z"/>
                      </svg>
                      Start
                    </a>
                  )}
                  {b.therapyNote ? (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckIcon className="w-4 h-4" />
                      Done
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddNote(b.id, b.user?.name)}
                      className="px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors font-medium"
                    >
                      Add Notes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      {dashboard.upcomingSessions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-100">
            <h2 className="font-semibold text-warm-900">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-warm-100">
            {dashboard.upcomingSessions.slice(0, 5).map((b: any) => (
              <div key={b.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warm-100 rounded-full flex items-center justify-center text-warm-600 text-sm font-medium">
                    {(b.user?.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-warm-800 text-sm">{b.user?.name || "Client"}</p>
                    <p className="text-xs text-warm-500">{b.session.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-warm-700">
                    {new Date(b.session.startTime).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-warm-500">
                    {new Date(b.session.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all ${
        highlight
          ? "bg-amber-50 border-amber-200 hover:border-amber-300"
          : "bg-white border-warm-200 hover:border-brand-300"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
        highlight ? "bg-amber-100" : "bg-brand-50"
      }`}>
        <span className={highlight ? "text-amber-600" : "text-brand-600"}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-700" : "text-warm-900"}`}>
        {value}
      </p>
      <p className="text-sm text-warm-500 mt-0.5">{label}</p>
    </Wrapper>
  );
}

function ClientsTab({
  clients,
  search,
  onSearchChange,
  onSelectClient,
}: {
  clients: TherapistClient[];
  search: string;
  onSearchChange: (v: string) => void;
  onSelectClient: (c: TherapistClient) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
        <input
          type="text"
          placeholder="Search clients by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <UsersIcon className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500">No clients found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-warm-100">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectClient(c)}
                className="w-full p-4 flex items-center justify-between hover:bg-warm-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-lg">
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-warm-900">{c.name || "Unknown"}</p>
                    <p className="text-sm text-warm-500">{c.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-600">{c.totalSessions} sessions</p>
                  <p className="text-xs text-warm-500">
                    Last: {new Date(c.lastSessionDate).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingTab({
  bookings,
  onAddNote,
}: {
  bookings: any[];
  onAddNote: (id: string, name?: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-warm-900 mb-1">All caught up!</h3>
        <p className="text-warm-500">All your session notes are complete</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="divide-y divide-warm-100">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold">
                {(b.user?.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-warm-900">{b.user?.name || "Client"}</p>
                <p className="text-sm text-warm-500">
                  {b.session.title} &middot; {new Date(b.session.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => onAddNote(b.id, b.user?.name)}
              className="px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              Add Notes
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icons
function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function NoteIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
