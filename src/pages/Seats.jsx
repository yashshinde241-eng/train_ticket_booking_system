import { useBooking } from '../context/BookingContext';
import { CLASS_INFO, BERTH_OPTIONS, formatDate } from '../counter';

export default function Seats({ onProceed, onBack }) {
  const { selectedTrain, seatSelection, setSeatSelection, searchParams } = useBooking();

  if (!selectedTrain) return null;

  const { classType, passengers, berthPreference } = seatSelection;

  const selectedClass = selectedTrain.classes.find(c => c.code === classType);
  const basePrice = selectedClass ? selectedClass.price : 0;
  const serviceFee = passengers > 0 ? 35 * passengers : 0;
  const totalFare = basePrice * passengers + serviceFee;

  const setClass = (code) => setSeatSelection(s => ({ ...s, classType: code }));
  const setPassengers = (n) => setSeatSelection(s => ({ ...s, passengers: Math.max(1, Math.min(6, n)) }));
  const setBerth = (b) => setSeatSelection(s => ({ ...s, berthPreference: b }));

  const canProceed = !!classType && passengers >= 1;

  return (
    <div className="seats-page">
      {/* INFO BANNER */}
      <div className="info-banner">
        <div className="journey-info">
          <h3>{selectedTrain.name} <span style={{ fontWeight: 400, fontSize: '0.85rem', opacity: 0.7 }}>#{selectedTrain.number}</span></h3>
          <p>{formatDate(searchParams.date)} • Quota: {searchParams.quota}</p>
        </div>
        <div className="journey-route">
          <span>{searchParams.from}</span>
          <span className="arrow">→</span>
          <span>{searchParams.to}</span>
          <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '0.9rem' }}>{selectedTrain.departure} – {selectedTrain.arrival}</span>
        </div>
      </div>

      {/* SEAT CLASS SELECTION */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>Select <span>Class</span></h2>
        <p className="section-subtitle">Choose your preferred travel class</p>
      </div>

      <div className="seats-grid">
        {selectedTrain.classes.map(cls => {
          const info = CLASS_INFO[cls.code] || { name: cls.name, desc: '', icon: '' };
          const isWaiting = cls.status.startsWith('WL');
          return (
            <div
              key={cls.code}
              className={`seat-class-card ${classType === cls.code ? 'selected' : ''}`}
              onClick={() => setClass(cls.code)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                <div>
                  <div className="seat-class-name">{cls.code} – {info.name}</div>
                  <div className="seat-class-desc">{info.desc}</div>
                </div>
              </div>
              <div className="seat-price">₹{cls.price.toLocaleString('en-IN')} <span>/ person</span></div>
              <div className={`seat-availability ${isWaiting ? 'avail-orange' : 'avail-green'}`}>
                {isWaiting ? ` ${cls.status}` : ` ${cls.available} Available`}
              </div>
            </div>
          );
        })}
      </div>

      {/* PASSENGERS */}
      <div className="passengers-section">
        <h3>Passenger Details</h3>

        <div className="passenger-counter">
          <button className="counter-btn" onClick={() => setPassengers(passengers - 1)}>−</button>
          <div className="counter-val">{passengers}</div>
          <button className="counter-btn" onClick={() => setPassengers(passengers + 1)}>+</button>
          <div className="counter-label">
            Passenger{passengers > 1 ? 's' : ''} <span style={{ fontSize: '0.78rem', color: 'var(--gray-300)' }}>(Max 6)</span>
          </div>
        </div>

        {classType && ['SL', '2A', '3A', '1A'].includes(classType) && (
          <div className="berth-prefs">
            <h4>Berth Preference</h4>
            <div className="berth-options">
              {BERTH_OPTIONS.map(b => (
                <button
                  key={b}
                  className={`berth-chip ${berthPreference === b ? 'selected' : ''}`}
                  onClick={() => setBerth(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PRICE SUMMARY */}
      <div className="price-summary-card">
        <h3>Fare Summary</h3>
        <div className="price-row">
          <span className="label">Base Fare ({classType || '---'} × {passengers})</span>
          <span>₹{(basePrice * passengers).toLocaleString('en-IN')}</span>
        </div>
        <div className="price-row">
          <span className="label">Reservation + Service Fee</span>
          <span>₹{serviceFee}</span>
        </div>
        <div className="price-row">
          <span className="label">GST (5%)</span>
          <span>₹{Math.round((basePrice * passengers) * 0.05).toLocaleString('en-IN')}</span>
        </div>
        <div className="price-row total">
          <span className="label">Total Payable</span>
          <span>₹{(totalFare + Math.round((basePrice * passengers) * 0.05)).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <button
        className="proceed-btn"
        disabled={!canProceed}
        onClick={() => canProceed && onProceed(totalFare + Math.round((basePrice * passengers) * 0.05))}
      >
        {!canProceed ? 'Please Select a Class to Continue' : `Proceed to Book — ₹${(totalFare + Math.round((basePrice * passengers) * 0.05)).toLocaleString('en-IN')}`}
      </button>

      <button
        onClick={onBack}
        style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.9rem', padding: '0.5rem' }}
      >
        ← Back to Train List
      </button>
    </div>
  );
}