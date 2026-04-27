import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDB, searchTrainsDB, saveTicket, getTicketsByUser, updateTrainAvailability } from '../db/database';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [dbReady, setDbReady]       = useState(false);
  const [user, setUser]             = useState(null);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    travelClass: 'ALL',
    quota: 'GENERAL',
  });
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [seatSelection, setSeatSelection] = useState({
    classType: null,
    passengers: 1,
    berthPreference: 'No Preference',
  });
  const [booking, setBooking]   = useState(null);
  const [myTickets, setMyTickets] = useState([]);

  // ── Init DB on app start ──────────────────────────────────────────────────
  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch(err => {
        console.error('[DB] Failed to initialise:', err);
        setDbReady(true); // still allow app to run
      });
  }, []);

  // ── Reload tickets whenever user changes ──────────────────────────────────
  useEffect(() => {
    if (user?.username) {
      getTicketsByUser(user.username)
        .then(setMyTickets)
        .catch(console.error);
    } else {
      setMyTickets([]);
    }
  }, [user]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (username) => setUser({ username, name: username });

  const logout = () => {
    setUser(null);
    setSelectedTrain(null);
    setSeatSelection({ classType: null, passengers: 1, berthPreference: 'No Preference' });
    setSearchParams({
      from: '', to: '',
      date: new Date().toISOString().split('T')[0],
      travelClass: 'ALL', quota: 'GENERAL',
    });
    setBooking(null);
    setMyTickets([]);
  };

  // ── Train search from DB ──────────────────────────────────────────────────
  const loadTrains = useCallback(async (from, to) => {
    const results = await searchTrainsDB(from, to);
    return results;
  }, []);

  // ── Confirm booking: save ticket + decrement availability ─────────────────
  const confirmBooking = useCallback(async (ticketData) => {
    try {
      // Save ticket to DB
      await saveTicket(ticketData);
      // Decrement seat availability in train record
      await updateTrainAvailability(
        ticketData.trainId,
        ticketData.classCode,
        ticketData.passengers
      );
      // Refresh my tickets
      const updated = await getTicketsByUser(ticketData.username);
      setMyTickets(updated);
      console.log('[DB] Booking saved:', ticketData.pnr);
    } catch (err) {
      console.error('[DB] Failed to save booking:', err);
    }
  }, []);

  // ── Refresh my tickets manually ────────────────────────────────────────────
  const refreshMyTickets = useCallback(async () => {
    if (!user?.username) return;
    const tickets = await getTicketsByUser(user.username);
    setMyTickets(tickets);
  }, [user]);

const [pnr, setPnr] = useState("");
const [status, setStatus] = useState("");
const [vacancy, setVacancy] = useState("");

const checkPNR = async () => {
  if (!pnr) {
    alert("Enter PNR");
    return;
  }

  const res = await fetch(`/api/pnr/${pnr}`);
  const data = await res.json();

  setStatus(data.status);
};

const checkVacancy = async () => {
  const res = await fetch(`/api/vacancy`);
  const data = await res.json();

  setVacancy(data.available);
};

  return (
    <BookingContext.Provider value={{
      dbReady,
      user, login, logout,
      searchParams, setSearchParams,
      selectedTrain, setSelectedTrain,
      seatSelection, setSeatSelection,
      booking, setBooking,
      myTickets,
      loadTrains,
      confirmBooking,
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