import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
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

  if (loading) return <Text>Loading sessions...</Text>;

  return (
    <View>
      <Text>Available sessions</Text>
      {sessions.map((s) => (
        <View key={s.id}>
          <Text>{s.title}</Text>
          <Text>{s.host}</Text>
          <Text>
            {s.currency} {s.price}
          </Text>
          <Button title="Book" onPress={() => onSelect(s)} />
        </View>
      ))}
    </View>
  );
}
