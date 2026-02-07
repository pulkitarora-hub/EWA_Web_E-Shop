import React, { useEffect, useState } from "react";
import { fetchSessions, Session } from "./sessionApi";

type Props = {
  onSelect: (session: Session) => void;
};

export function SessionList({ onSelect }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSessions().then((data) => {
      if (mounted) {
        setSessions(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading sessions...</div>;

  return (
    <div>
      <h2>Available sessions</h2>
      {sessions.map((s) => (
        <div key={s.id}>
          <div>{s.title}</div>
          <div>{s.host}</div>
          <div>
            {s.currency} {s.price}
          </div>
          <button onClick={() => onSelect(s)}>Book</button>
        </div>
      ))}
    </div>
  );
}
