import React, { useEffect, useState } from "react";
import { fetchSessions, Session } from "./sessionApi";

type Props = {
  onSelect: (session: Session) => void;
};

type Tab = "single" | "packages";
type Duration = "45" | "60" | "75" | "90";

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "75 min" },
  { value: "90", label: "90 min" },
];

const INNER_BALANCE_BENEFITS = [
  "Weekly reserved slot as emotional anchor",
  "Stabilizes the nervous system",
  "More affordable than standalone",
  "Builds therapeutic continuity",
  "Safe opening of deeper layers",
];

const STANDALONE_INPERSON_ADDON = 500;

const DEEP_WORK_BENEFITS = [
  "Twice-weekly healing momentum",
  "Faster nervous-system rewiring",
  "Ideal for trauma & relationship wounds",
  "Healing acceleration field",
  "Highest savings per session",
];

function parseDuration(title: string): Duration | null {
  const match = title.match(/(\d+)\s*min/);
  if (!match) return null;
  const val = match[1];
  if (["45", "60", "75", "90"].includes(val)) return val as Duration;
  return null;
}

function categoriseSessions(sessions: Session[]) {
  const standalone: Session[] = [];
  const innerBalance: Session[] = [];
  const deepWork: Session[] = [];
  const legacy: Session[] = [];

  for (const s of sessions) {
    if (s.title.startsWith("Standalone Clarity")) standalone.push(s);
    else if (s.title.startsWith("Steady Inner Balance")) innerBalance.push(s);
    else if (s.title.startsWith("Deep Work Subscription")) deepWork.push(s);
    else legacy.push(s);
  }

  return { standalone, innerBalance, deepWork, legacy };
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function formatPrice(price: number) {
  return price.toLocaleString("en-IN");
}

function DurationPills({
  selected,
  onChange,
}: {
  selected: Duration;
  onChange: (d: Duration) => void;
}) {
  return (
    <div className="flex gap-2">
      {DURATION_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
            selected === opt.value
              ? "bg-brand-500 border-brand-500 text-white shadow-sm"
              : "border-warm-200 text-charcoal-lighter hover:border-brand-300 hover:text-brand-600"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function InPersonToggle({
  enabled,
  onChange,
  addon,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  addon: number;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-brand-500" : "bg-warm-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-charcoal-light">
        In-Person{" "}
        <span className="text-charcoal-lighter">(+₹{addon}/session)</span>
      </span>
    </label>
  );
}

function PackageCard({
  title,
  subtitle,
  icon,
  badge,
  badgeStyle,
  benefits,
  sessions,
  inPersonAddon,
  onSelect,
  accentBorder,
  buttonStyle,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  badgeStyle: string;
  benefits: string[];
  sessions: Session[];
  inPersonAddon: number;
  onSelect: (session: Session) => void;
  accentBorder: string;
  buttonStyle: string;
}) {
  const [selectedDuration, setSelectedDuration] = useState<Duration>("60");
  const [inPerson, setInPerson] = useState(false);

  const sessionByDuration = new Map<Duration, Session>();
  for (const s of sessions) {
    const d = parseDuration(s.title);
    if (d) sessionByDuration.set(d, s);
  }

  const activeSession = sessionByDuration.get(selectedDuration);
  const perSession = activeSession
    ? activeSession.price / (title.includes("Deep Work") ? 8 : 4)
    : 0;
  const monthlyTotal = activeSession ? activeSession.price : 0;
  const displayPerSession = inPerson ? perSession + inPersonAddon : perSession;
  const displayMonthly = inPerson
    ? monthlyTotal + inPersonAddon * (title.includes("Deep Work") ? 8 : 4)
    : monthlyTotal;

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${accentBorder} shadow-lg shadow-warm-200/20 flex flex-col overflow-hidden`}
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-warm-100">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal">{title}</h3>
              <p className="text-sm text-charcoal-lighter">{subtitle}</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeStyle}`}>
            {badge}
          </span>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-charcoal">
              ₹{formatPrice(displayMonthly)}
            </span>
            <span className="text-sm text-charcoal-lighter">/month</span>
          </div>
          <p className="text-sm text-charcoal-lighter mt-0.5">
            ₹{formatPrice(displayPerSession)} per session
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-warm-100 mb-5" />

        {/* Benefits */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-charcoal-light">
              <CheckIcon />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* Duration pills */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
            Session Duration
          </p>
          <DurationPills selected={selectedDuration} onChange={setSelectedDuration} />
        </div>

        {/* In-person toggle */}
        <div className="mb-5">
          <InPersonToggle enabled={inPerson} onChange={setInPerson} addon={inPersonAddon} />
        </div>

        {/* Subscribe button */}
        <button
          onClick={() => activeSession && onSelect(activeSession)}
          disabled={!activeSession}
          className={`w-full py-3.5 rounded-xl font-semibold text-base shadow-md transition disabled:bg-warm-300 disabled:cursor-not-allowed ${buttonStyle}`}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

export function SessionList({ onSelect }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("packages");
  const [standaloneInPerson, setStandaloneInPerson] = useState(false);

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-700 border-t-brand-400 rounded-full animate-spin" />
        <p className="text-charcoal-lighter text-sm mt-3">Loading sessions...</p>
      </div>
    );
  }

  const { standalone, innerBalance, deepWork, legacy } = categoriseSessions(sessions);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-charcoal mb-1">No sessions available</h3>
        <p className="text-sm text-charcoal-lighter">Check back soon for upcoming sessions.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-charcoal">
          Choose Your Healing Path
        </h2>
        <p className="text-charcoal-lighter mt-2 max-w-lg mx-auto">
          Invest in your emotional well-being with the right healing rhythm.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-warm-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
              activeTab === "single"
                ? "bg-white text-charcoal shadow-sm"
                : "text-charcoal-lighter hover:text-charcoal"
            }`}
          >
            Single Sessions
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
              activeTab === "packages"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-charcoal-lighter hover:text-charcoal"
            }`}
          >
            Monthly Packages
          </button>
        </div>
      </div>

      {/* Single Sessions Tab */}
      {activeTab === "single" && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-charcoal">
              Standalone Clarity Session
            </h3>
            <p className="text-sm text-charcoal-lighter mt-1">
              For occasional support or single-session clarity work.
            </p>
          </div>

          {/* In-Person Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-4 bg-warm-100 rounded-2xl px-6 py-3">
              <span className="text-sm font-medium text-charcoal">Session Type:</span>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className={`text-sm ${!standaloneInPerson ? 'font-semibold text-brand-600' : 'text-charcoal-light'}`}>
                  💻 Online
                </span>
                <button
                  role="switch"
                  aria-checked={standaloneInPerson}
                  onClick={() => setStandaloneInPerson(!standaloneInPerson)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    standaloneInPerson ? "bg-brand-500" : "bg-warm-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      standaloneInPerson ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`text-sm ${standaloneInPerson ? 'font-semibold text-brand-600' : 'text-charcoal-light'}`}>
                  🏠 In-Person
                </span>
              </label>
              {standaloneInPerson && (
                <span className="text-xs text-charcoal-lighter bg-brand-100 text-brand-700 px-2 py-1 rounded-full">
                  +₹{STANDALONE_INPERSON_ADDON}/session
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {standalone.map((session) => {
              const duration = parseDuration(session.title) || "?";
              const displayPrice = standaloneInPerson 
                ? session.price + STANDALONE_INPERSON_ADDON 
                : session.price;
              return (
                <button
                  key={session.id}
                  onClick={() => onSelect(session)}
                  className={`text-left bg-white rounded-2xl border-2 p-6 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-200/20 transition-all group flex flex-col items-center text-center ${
                    standaloneInPerson ? 'border-brand-300' : 'border-warm-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    standaloneInPerson ? 'bg-brand-100' : 'bg-brand-50'
                  }`}>
                    {standaloneInPerson ? (
                      <span className="text-xl">🏠</span>
                    ) : (
                      <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-charcoal mb-1">
                    {duration} min
                  </p>
                  <p className="text-2xl font-bold text-brand-600 mb-1">
                    ₹{formatPrice(displayPrice)}
                  </p>
                  {standaloneInPerson && (
                    <p className="text-xs text-charcoal-lighter line-through mb-2">
                      ₹{formatPrice(session.price)} online
                    </p>
                  )}
                  <p className="text-xs text-charcoal-lighter mb-4">
                    {standaloneInPerson ? 'In-person session' : 'One-time session'}
                  </p>
                  <span className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition text-center">
                    Book Session
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      )}
      {/* Monthly Packages Tab */}
      {activeTab === "packages" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PackageCard
            title="Inner Balance"
            subtitle="4 Sessions/Month"
            icon={<span>🌿</span>}
            badge="Recommended"
            badgeStyle="bg-brand-100 text-brand-700"
            benefits={INNER_BALANCE_BENEFITS}
            sessions={innerBalance}
            inPersonAddon={499}
            onSelect={onSelect}
            accentBorder="border-brand-400"
            buttonStyle="bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/25"
          />
          <PackageCard
            title="Deep Work"
            subtitle="8 Sessions/Month"
            icon={<span>🔥</span>}
            badge="Best Value"
            badgeStyle="bg-deep/10 text-deep"
            benefits={DEEP_WORK_BENEFITS}
            sessions={deepWork}
            inPersonAddon={399}
            onSelect={onSelect}
            accentBorder="border-deep/30"
            buttonStyle="bg-deep hover:bg-deep-light text-white shadow-deep/25"
          />
        </div>
      )}
    </div>
  );
}
