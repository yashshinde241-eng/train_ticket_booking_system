import { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../counter';

const QUOTA_OPTIONS = ['GENERAL', 'LADIES', 'TATKAL', 'PREMIUM TATKAL', 'DEFENCE', 'DIVYAANG'];
const CLASS_OPTIONS = ['ALL', '1A', '2A', '3A', 'SL', '2S', 'CC'];
const DAYS          = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Booking({ onSelectTrain }) {
  const { searchParams, setSearchParams, loadTrains } = useBooking();
  const [trains,   setTrains]   = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSearch = async () => {
    if (!searchParams.from.trim()) { setError('Please enter From station.'); return; }
    if (!searchParams.to.trim())   { setError('Please enter To station.');   return; }
    if (searchParams.from.trim().toLowerCase() === searchParams.to.trim().toLowerCase()) {
      setError('From and To stations cannot be the same.'); return;
    }
    setError('');
    setLoading(true);
    try {
      // ── Load trains from IndexedDB ─────────────────────────────────────────
      const results = await loadTrains(searchParams.from.trim(), searchParams.to.trim());
      setTrains(results);
      setSearched(true);
    } catch (err) {
      console.error('[Booking] Search error:', err);
      setError('Failed to load trains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () =>
    setSearchParams(p => ({ ...p, from: p.to, to: p.from }));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-page">
      <div>
        <h2 className="section-title">Book <span>Train Tickets</span></h2>
        <p className="section-subtitle">Search from 8000+ trains across India • Fast &amp; Secure</p>
      </div>

      <div className="search-card">
        {error && <div className="error-msg" style={{ marginBottom: '1rem' }}> {error}</div>}

        <div className="search-row">
          <div className="form-field">
            <label> From Station</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, PUNE, NDLS"
              value={searchParams.from}
              onChange={e => setSearchParams(p => ({ ...p, from: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <button className="swap-btn" onClick={handleSwap} title="Swap stations">⇄</button>

          <div className="form-field">
            <label> To Station</label>
            <input
              type="text"
              placeholder="e.g. Delhi, CSTM, HWH"
              value={searchParams.to}
              onChange={e => setSearchParams(p => ({ ...p, to: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="search-bottom-row">
          <div className="form-field">
            <label> Date of Journey</label>
            <input
              type="date"
              value={searchParams.date}
              min={today}
              onChange={e => setSearchParams(p => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label> Travel Class</label>
            <select
              value={searchParams.travelClass}
              onChange={e => setSearchParams(p => ({ ...p, travelClass: e.target.value }))}
            >
              {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button className="search-btn" onClick={handleSearch}>
             Search Trains
          </button>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {QUOTA_OPTIONS.map(q => (
            <label key={q} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: searchParams.quota === q ? 'var(--navy)' : 'var(--gray-500)' }}>
              <input
                type="radio"
                name="quota"
                value={q}
                checked={searchParams.quota === q}
                onChange={() => setSearchParams(p => ({ ...p, quota: q }))}
                style={{ accentColor: 'var(--navy)' }}
              />
              {q}
            </label>
          ))}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
          <div className="loading-text">Searching trains for {searchParams.from} → {searchParams.to}...</div>
        </div>
      )}

      {/* RESULTS */}
      {searched && !loading && (
        <>
          <div className="results-header">
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {searchParams.from} → {searchParams.to}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-500)', fontFamily: 'Nunito, sans-serif', textTransform: 'none', letterSpacing: 0, marginLeft: '0.75rem' }}>
                {formatDate(searchParams.date)}
              </span>
            </h3>
            <div className="results-count"><span>{trains.length}</span> Trains Found</div>
          </div>

          {trains.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No trains found for this route. Try different stations or date.</p>
            </div>
          ) : (
            trains.map(train => (
              <TrainCard key={train.id} train={train} onBook={onSelectTrain} />
            ))
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <p>Enter your journey details above and click "Search Trains" to find available trains</p>
        </div>
      )}
    </div>
  );
}

function TrainCard({ train, onBook }) {
  return (
    <div className="train-card" onClick={() => onBook(train)}>
      <div className="train-header">
        <div>
          <div className="train-name">{train.name}</div>
          <div className="train-number">#{train.number}</div>
        </div>
        <span className={`train-badge badge-${train.type}`}>
          {train.type === 'superfast' ? ' Superfast' : ' Express'}
        </span>
      </div>

      <div className="train-timing">
        <div className="time-block">
          <div className="time">{train.departure}</div>
          <div className="station">{train.from.name}</div>
        </div>
        <div className="journey-line">
          <div className="journey-duration">{train.duration}</div>
          <div className="journey-track" />
          <div className="journey-stops">{train.stops} stops</div>
        </div>
        <div className="time-block" style={{ textAlign: 'right' }}>
          <div className="time">{train.arrival}</div>
          <div className="station">{train.to.name}</div>
        </div>
      </div>

      <div className="train-classes">
        {train.classes.map(cls => (
          <div key={cls.code} className="class-tag">
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', fontWeight: 700 }}>{cls.code}</div>
            <div className="class-name">{cls.name}</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>₹{cls.price}</div>
            <div className={`avail ${cls.status.startsWith('WL') ? 'waiting' : ''}`}>
              {cls.status.startsWith('AVL') ? `${cls.available} Avail` : cls.status}
            </div>
          </div>
        ))}
      </div>

      <div className="train-footer">
        <div className="train-days">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`day-dot ${train.days.includes(d) ? 'active' : ''}`}>
              {DAYS[i]}
            </div>
          ))}
        </div>
        <button className="book-btn" onClick={e => { e.stopPropagation(); onBook(train); }}>
          Book Now →
        </button>
      </div>
    </div>
  );
}