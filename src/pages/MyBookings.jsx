import { useEffect, useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../counter';

const STATUS_COLOR = {
  CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: '✓ CNF' },
  CANCELLED: { bg: '#fee2e2', color: '#dc2626', label: '✗ CXL' },
  WAITING:   { bg: '#fef9c3', color: '#ca8a04', label: '⏳ WL' },
};

export default function MyBookings() {
  const { myTickets, refreshMyTickets, user } = useBooking();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshMyTickets().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <div className="loading-text">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">My <span>Bookings</span></h2>
        <p className="section-subtitle">
          All tickets booked by <strong>{user?.username}</strong>
        </p>
      </div>

      {myTickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <p>No bookings yet. Search for trains and book your first ticket!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myTickets.map(ticket => (
            <TicketCard key={ticket.pnr} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }) {
  const { cancelBooking, sendCancellationEmail } = useBooking();
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');
  const statusStyle = STATUS_COLOR[ticket.status] || STATUS_COLOR.CONFIRMED;
  const isCancelled = ticket.status === 'CANCELLED';

  const handleCancel = async () => {
    if (!confirm(`Cancel ticket PNR ${ticket.pnr}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const cancelled = await cancelBooking(ticket.pnr);
      // Auto-send cancellation email to the contactEmail stored on the ticket
      const to = ticket.contactEmail;
      await sendCancellationEmail(cancelled || ticket, to);
      setCancelMsg('Ticket cancelled. Cancellation email sent.');
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: `1px solid ${isCancelled ? '#fca5a5' : '#e2e8f0'}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
      opacity: isCancelled ? 0.8 : 1,
    }}>
      {/* Card Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: isCancelled ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' : 'linear-gradient(135deg,#1e3a5f,#1a5276)',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🚆</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem' }}>
              {ticket.trainName}
              <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.82rem', marginLeft: '0.5rem' }}>#{ticket.trainNumber}</span>
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
              {ticket.from} → {ticket.to} &nbsp;•&nbsp; {formatDate(ticket.date)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fbbf24', fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>
              ₹{ticket.totalFare?.toLocaleString('en-IN')}
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.72rem' }}>Total Fare</div>
          </div>
          <span style={{ color: '#93c5fd', fontSize: '1.1rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {/* Quick Info Row */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #f1f5f9' }}>
        {[
          { label: 'PNR',        value: ticket.pnr },
          { label: 'Class',      value: `${ticket.classCode} – ${ticket.className}` },
          { label: 'Passengers', value: ticket.passengers },
          { label: 'Quota',      value: ticket.quota },
          { label: 'Booked On',  value: ticket.bookedAt ? new Date(ticket.bookedAt).toLocaleDateString('en-IN') : '—' },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, padding: '0.65rem 1rem', borderRight: i < 4 ? '1px solid #f1f5f9' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>{item.label}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '0.75rem' }}>
            Passenger Details
          </div>
          <table className="passenger-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>#</th><th>Name</th><th>Age</th><th>Gender</th><th>Berth</th><th>Seat</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(ticket.seats || []).map((s, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.age}</td>
                  <td>{s.gender}</td>
                  <td>{s.berth}</td>
                  <td style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{s.seat}</td>
                  <td style={{ color: isCancelled ? '#dc2626' : 'var(--success)', fontWeight: 700 }}>
                    {isCancelled ? 'CXL' : s.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isCancelled && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  padding: '0.6rem 1.5rem', border: '1px solid #ef4444', borderRadius: '8px',
                  background: cancelling ? '#fee2e2' : '#fff', color: '#dc2626',
                  fontWeight: 700, fontSize: '0.9rem', cursor: cancelling ? 'not-allowed' : 'pointer',
                }}
              >
                {cancelling ? '⏳ Cancelling...' : '✗ Cancel Ticket'}
              </button>
              {cancelMsg && (
                <span style={{ fontSize: '0.8rem', color: '#15803d' }}>✓ {cancelMsg}</span>
              )}
            </div>
          )}

          {isCancelled && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '8px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
              ✗ This ticket has been cancelled. Refund will be processed within 5–7 business days.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
