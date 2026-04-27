import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { initDB, searchTrainsDB, saveTicket, getTicketsByUser, updateTrainAvailability } from '../db/database';

const BookingContext = createContext(null);
const API    = 'http://localhost:5000';
const socket = io(API, { autoConnect: true });

// ── Persist JWT in localStorage ───────────────────────────────────────────────
const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem('irctc_auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const setStoredAuth = (data) => {
  if (data) localStorage.setItem('irctc_auth', JSON.stringify(data));
  else localStorage.removeItem('irctc_auth');
};

export function BookingProvider({ children }) {
  const [dbReady, setDbReady]     = useState(false);
  const [user, setUser]           = useState(() => {
    const stored = getStoredAuth();
    return stored ? { username: stored.username, email: stored.email, token: stored.token, role: stored.role } : null;
  });
  const [searchParams, setSearchParams] = useState({
    from: '', to: '',
    date: new Date().toISOString().split('T')[0],
    travelClass: 'ALL', quota: 'GENERAL',
  });
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [seatSelection, setSeatSelection] = useState({
    classType: null, passengers: 1, berthPreference: 'No Preference',
    selectedBerths: [], selectedCoach: '', passengerNames: [],
  });
  const [booking, setBooking]   = useState(null);
  const [myTickets, setMyTickets] = useState([]);

  useEffect(() => {
    initDB().then(() => setDbReady(true)).catch(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if (user?.username) {
      getTicketsByUser(user.username).then(setMyTickets).catch(console.error);
    } else {
      setMyTickets([]);
    }
  }, [user]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    const userData = { username: data.username, email: data.email, token: data.token, role: data.role || 'user' };
    setStoredAuth(userData);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    const userData = { username: data.username, email: data.email, token: data.token, role: data.role || 'user' };
    setStoredAuth(userData);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setUser(null);
    setSelectedTrain(null);
    setSeatSelection({ classType: null, passengers: 1, berthPreference: 'No Preference', selectedBerths: [], selectedCoach: '', passengerNames: [] });
    setSearchParams({ from: '', to: '', date: new Date().toISOString().split('T')[0], travelClass: 'ALL', quota: 'GENERAL' });
    setBooking(null);
    setMyTickets([]);
  }, []);

  // ── Train search ──────────────────────────────────────────────────────────
  const loadTrains = useCallback(async (from, to) => {
    return await searchTrainsDB(from, to);
  }, []);

  // ── Confirm booking: save to IndexedDB + MongoDB + log ────────────────────────
  const confirmBooking = useCallback(async (ticketData) => {
    try {
      // 1. Save to IndexedDB (local)
      await saveTicket(ticketData);
      await updateTrainAvailability(ticketData.trainId, ticketData.classCode, ticketData.passengers);

      if (user?.token) {
        // 2. Save to MongoDB (needed for server-side cancellation)
        await fetch(`${API}/api/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify(ticketData),
        });

        // 3. Log booking entry
        await fetch(`${API}/api/booking-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({
            pnr: ticketData.pnr, trainName: ticketData.trainName, trainNumber: ticketData.trainNumber,
            from: ticketData.from, to: ticketData.to, date: ticketData.date,
            classCode: ticketData.classCode, passengers: ticketData.passengers,
            totalFare: ticketData.totalFare, status: 'CONFIRMED',
          }),
        });
      }

      const updated = await getTicketsByUser(ticketData.username);
      setMyTickets(updated);
    } catch (err) {
      console.error('[DB] Failed to save booking:', err);
    }
  }, [user]);

  // ── Cancel booking ────────────────────────────────────────────────────────
  const cancelBooking = useCallback(async (pnr) => {
    if (!user?.token) throw new Error('Not authenticated');
    const res = await fetch(`${API}/api/tickets/${pnr}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cancellation failed');
    // Update local IndexedDB ticket status
    const { getTicketByPNR, saveTicket: updateTicket } = await import('../db/database');
    const local = await getTicketByPNR(pnr);
    if (local) await updateTicket({ ...local, status: 'CANCELLED' });
    const updated = await getTicketsByUser(user.username);
    setMyTickets(updated);
    return data.ticket;
  }, [user]);

  // ── Send confirmation email ───────────────────────────────────────────────
  const sendConfirmationEmail = useCallback(async (ticket, toEmail) => {
    if (!user?.token) return null;
    const to = toEmail || user?.email;
    if (!to) return null;
    const res = await fetch(`${API}/api/email/booking-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ to, ticket }),
    });
    const data = await res.json();
    return data.previewUrl || null;
  }, [user]);

  // ── Send cancellation email ───────────────────────────────────────────────
  const sendCancellationEmail = useCallback(async (ticket, toEmail) => {
    if (!user?.token) return null;
    const to = toEmail || ticket?.contactEmail || user?.email;
    if (!to) return null;
    const res = await fetch(`${API}/api/email/cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ to, ticket }),
    });
    const data = await res.json();
    return data.previewUrl || null;
  }, [user]);

  const refreshMyTickets = useCallback(async () => {
    if (!user?.username) return;
    const tickets = await getTicketsByUser(user.username);
    setMyTickets(tickets);
  }, [user]);

  return (
    <BookingContext.Provider value={{
      dbReady, socket,
      user, login, register, logout,
      searchParams, setSearchParams,
      selectedTrain, setSelectedTrain,
      seatSelection, setSeatSelection,
      booking, setBooking,
      myTickets,
      loadTrains,
      confirmBooking,
      cancelBooking,
      sendConfirmationEmail,
      sendCancellationEmail,
      refreshMyTickets,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
