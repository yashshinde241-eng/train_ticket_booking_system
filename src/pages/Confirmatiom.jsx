import { useBooking } from '../context/BookingContext';
import { generatePNR, formatDate, formatDay, CLASS_INFO } from '../counter';
import { useState, useEffect, useRef } from 'react';

export default function Confirmation({ totalFare, onNewBooking }) {
  const { selectedTrain, seatSelection, searchParams, user, confirmBooking } = useBooking();
  const [pnr]     = useState(() => generatePNR());
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const savedRef  = useRef(false); // prevent double-save in StrictMode

  const selectedClass = selectedTrain?.classes.find(c => c.code === seatSelection.classType);
  const classInfo     = CLASS_INFO[seatSelection.classType] || { name: seatSelection.classType };

  // Generate seat assignments
  const seats = Array.from({ length: seatSelection.passengers }, (_, i) => ({
    name:   i === 0 ? (user?.name || 'Passenger') : `Co-Passenger ${i + 1}`,
    age:    25 + i * 5,
    gender: i % 2 === 0 ? 'M' : 'F',
    berth:  seatSelection.berthPreference === 'No Preference'
              ? ['Lower', 'Middle', 'Upper'][i % 3]
              : seatSelection.berthPreference,
    seat:   `B${Math.floor(Math.random() * 8) + 1}/${40 + i}`,
    status: 'CNF',
  }));

  const serviceCharge = 35 * seatSelection.passengers;
  const gst           = selectedClass
    ? Math.round(selectedClass.price * seatSelection.passengers * 0.05)
    : 0;
  const txnId = `TXN${Date.now().toString().slice(-10)}`;

  // ── Save ticket to IndexedDB once on mount ─────────────────────────────────
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    if (!selectedTrain || !user) return;

    setSaving(true);
    const ticketData = {
      pnr,
      username:    user.username,
      trainId:     selectedTrain.id,
      trainName:   selectedTrain.name,
      trainNumber: selectedTrain.number,
      from:        searchParams.from,
      to:          searchParams.to,
      date:        searchParams.date,
      classCode:   seatSelection.classType,
      className:   classInfo.name,
      quota:       searchParams.quota,
      passengers:  seatSelection.passengers,
      berthPref:   seatSelection.berthPreference,
      seats,
      totalFare,
      txnId,
      status:      'CONFIRMED',
    };

    confirmBooking(ticketData)
      .then(() => { setSaved(true); setSaving(false); })
      .catch(err => { console.error('[Confirmation] Save error:', err); setSaving(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="confirmation-page">
      {/* SUCCESS BANNER */}
      <div className="success-banner">
        <div className="success-icon">✓</div>
        <h2>Booking Confirmed!</h2>
        <p>Your ticket has been booked successfully. Check your email for details.</p>
        {saving && (
          <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: '0.25rem' }}>
            ⏳ Saving to database...
          </p>
        )}
        {saved && (
          <p style={{ fontSize: '0.82rem', color: '#86efac', marginTop: '0.25rem' }}>
             Ticket saved to database — visible in My Bookings
          </p>
        )}
      </div>

      {/* TICKET */}
      <div className="ticket">
        <div className="ticket-header">
          <div className="irctc-logo">
            IR<span>CTC</span>
            <div style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 400, fontFamily: 'Nunito, sans-serif', letterSpacing: 0 }}>
              Indian Railway Catering &amp; Tourism
            </div>
          </div>
          <div className="pnr-block">
            <div className="pnr-label">PNR Number</div>
            <div className="pnr-num">{pnr}</div>
          </div>
        </div>

        <div className="ticket-body">
          {/* ROUTE */}
          <div className="ticket-route">
            <div className="station-block">
              <div className="station-name">{searchParams.from?.substring(0, 6).toUpperCase()}</div>
              <div className="station-city">{searchParams.from}</div>
              <div className="depart-time">{selectedTrain?.departure}</div>
              <div className="depart-date">{formatDay(searchParams.date)}, {formatDate(searchParams.date)}</div>
            </div>

            <div className="route-middle">
              <div className="train-icon"></div>
              <div className="dotted-line" />
              <div className="duration">{selectedTrain?.duration}</div>
              <div className="dotted-line" />
            </div>

            <div className="station-block right">
              <div className="station-name">{searchParams.to?.substring(0, 6).toUpperCase()}</div>
              <div className="station-city">{searchParams.to}</div>
              <div className="depart-time">{selectedTrain?.arrival}</div>
              <div className="depart-date">{formatDay(searchParams.date)}, {formatDate(searchParams.date)}</div>
            </div>
          </div>

          <hr className="ticket-divider" />

          {/* DETAILS GRID */}
          <div className="ticket-details-grid">
            <div className="detail-item">
              <div className="detail-label">Train</div>
              <div className="detail-val">{selectedTrain?.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Train No.</div>
              <div className="detail-val">{selectedTrain?.number}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Class</div>
              <div className="detail-val">{seatSelection.classType} – {classInfo.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Quota</div>
              <div className="detail-val">{searchParams.quota}</div>
            </div>
          </div>

          <hr className="ticket-divider" />

          {/* PASSENGERS TABLE */}
          <table className="passenger-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Age</th><th>Gender</th>
                <th>Berth</th><th>Seat</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((s, i) => (
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

          <hr className="ticket-divider" />

          {/* FARE BREAKDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="detail-item" style={{ marginBottom: '0.5rem' }}>
                <div className="detail-label">Booked By</div>
                <div className="detail-val">{user?.name?.toUpperCase()}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Transaction ID</div>
                <div className="detail-val" style={{ fontSize: '0.85rem' }}>{txnId}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: '0.4rem' }}>
                Fare Breakdown
              </div>
              {selectedClass && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Base (×{seatSelection.passengers})</span>
                    <span style={{ fontWeight: 700 }}>₹{(selectedClass.price * seatSelection.passengers).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Reservation</span>
                    <span style={{ fontWeight: 700 }}>₹{serviceCharge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--gray-500)' }}>GST (5%)</span>
                    <span style={{ fontWeight: 700 }}>₹{gst}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ticket-footer">
          <div className="total-fare">
            <div className="fare-label">Total Fare Paid</div>
            <div className="fare-amount">₹{totalFare?.toLocaleString('en-IN')}</div>
          </div>
          <div className="status-badge">✓ Booking Confirmed</div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="action-btns">
        <button className="btn-outline" onClick={() => setTimeout(() => window.print?.(), 100)}>
          🖨 Print Ticket
        </button>
        <button className="btn-outline"> Email Ticket</button>
        <button className="btn-home" onClick={onNewBooking}> New Booking</button>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6 }}>
        <strong>Important:</strong> Please carry a valid photo ID proof during journey. This ticket is valid only with a government-issued ID. Web ticket is personal and non-transferable.
      </div>
    </div>
  );
}