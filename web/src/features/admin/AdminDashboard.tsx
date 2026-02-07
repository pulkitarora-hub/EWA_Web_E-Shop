import React, { useEffect, useState } from "react";
import {
  fetchAdminBookings,
  fetchAdminPayments,
  fetchAdminUsers,
} from "../../lib/api";

type Props = {
  isAdmin: boolean;
  token: string;
};

export function AdminDashboard({ isAdmin, token }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminUsers(token).then((res) => setUsers(res.users));
    fetchAdminBookings(token).then((res) => setBookings(res.bookings));
    fetchAdminPayments(token).then((res) => setPayments(res.payments));
  }, [isAdmin, token]);

  if (!isAdmin) return <div>Admin access required.</div>;

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>Users</h3>
      {users.map((u) => (
        <div key={u.id}>{u.phone || u.name}</div>
      ))}
      <h3>Bookings</h3>
      {bookings.map((b) => (
        <div key={b.id}>
          {b.sessionId} - {b.status}
        </div>
      ))}
      <h3>Payments</h3>
      {payments.map((p) => (
        <div key={p.id}>
          {p.bookingId} - {p.status}
        </div>
      ))}
    </div>
  );
}
