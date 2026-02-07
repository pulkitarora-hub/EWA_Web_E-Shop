import { fetchSessions as fetchSessionsApi, Session } from "../../lib/api";

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetchSessionsApi();
  return res.sessions.map((session: any) => ({
    ...session,
    id: session.id ?? session.sessionId,
  }));
}

export type { Session };
