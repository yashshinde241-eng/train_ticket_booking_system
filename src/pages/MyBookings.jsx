import { useEffect, useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../counter';

const STATUS_COLOR = {
  CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: '✓ CNF' },
  CANCELLED:  { bg: '#fee2e2', color: '#dc2626', label: '✗ CXL' },
  WAITING:    { bg: '#fef9c3', color: '#ca8a04', label: '⏳ WL' },
};

export default function MyBookings() {
  const { myTickets, refreshMyTickets, user } = useBooking();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshMyTickets().finally(() => setLoading(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">My <span>Bookings</span></h2>
        <p className="section-subtitle">
          All tickets booked by <strong>{user?.name}</strong> — saved in your local database
        </p>
      </div>

      {/* DB Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        border: '1px solid #bfdbfe', borderRadius: '12px',
        marginBottom: '1.5rem', fontSize: '0.85rem', color: '#1e40af', fontWeight: 600,
      }}>
        <span style={{ fontSize: '1.3rem' }}>🗄️</span>
        <span>Tickets are stored in your browser's <strong>IndexedDB</strong> — data persists even after refresh!</span>
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
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLOR[ticket.status] || STATUS_COLOR.CONFIRMED;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #1e3a5f, #1a5276)',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🚆</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem', letterSpacing: '0.3px' }}>
              {ticket.trainName}
              <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '0.82rem', marginLeft: '0.5rem' }}>#{ticket.trainNumber}</span>
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
              {ticket.from} → {ticket.to} &nbsp;•&nbsp; {formatDate(ticket.date)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Status Badge */}
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: statusStyle.bg,
            color: statusStyle.color,
          }}>
            {statusStyle.label}
          </span>
          {/* Total Fare */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fbbf24', fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>
              ₹{ticket.totalFare?.toLocaleString('en-IN')}
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.72rem' }}>Total Fare</div>
          </div>
          {/* Expand Arrow */}
          <span style={{ color: '#93c5fd', fontSize: '1.1rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Quick Info Row */}
      <div style={{
        display: 'flex', gap: '0', borderBottom: '1px solid #f1f5f9',
      }}>
        {[
          { label: 'PNR', value: ticket.pnr },
          { label: 'Class', value: `${ticket.classCode} – ${ticket.className}` },
          { label: 'Passengers', value: ticket.passengers },
          { label: 'Quota', value: ticket.quota },
          { label: 'Booked On', value: ticket.bookedAt ? new Date(ticket.bookedAt).toLocaleDateString('en-IN') : '—' },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1, padding: '0.65rem 1rem',
            borderRight: i < 4 ? '1px solid #f1f5f9' : 'none',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded: Passenger Table */}
      {expanded && (
        <div style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '0.75rem' }}>
            Passenger Details
          </div>
          <table className="passenger-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Age</th><th>Gender</th>
                <th>Berth</th><th>Seat</th><th>Status</th>
              </tr>
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
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <div style={{
              flex: 1, padding: '0.75rem 1rem',
              background: '#f8fafc', borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Transaction ID
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>{ticket.txnId}</div>
            </div>
            <div style={{
              flex: 1, padding: '0.75rem 1rem',
              background: '#f0fdf4', borderRadius: '10px',
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Berth Preference
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534' }}>{ticket.berthPref}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
