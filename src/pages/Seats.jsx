import { useState, useCallback, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { CLASS_INFO, BERTH_OPTIONS, formatDate } from '../counter';

// ─── Coach configs per class ─────────────────────────────────────────────────
const COACH_CONFIGS = {
  SL:  { coaches: ['S1','S2','S3','S4','S5','S6','S7','S8'], bays: 8, hasMiddle: true,  label: 'Sleeper Class' },
  '3A':{ coaches: ['B1','B2','B3','B4','B5'],                bays: 8, hasMiddle: true,  label: 'Third AC'      },
  '2A':{ coaches: ['A1','A2','A3'],                          bays: 6, hasMiddle: false, label: 'Second AC'     },
  '1A':{ coaches: ['H1','H2'],                               bays: 4, hasMiddle: false, label: 'First AC'      },
};

const BERTH_COLORS = {
  lower:       '#1D9E75',
  middle:      '#185FA5',
  upper:       '#BA7517',
  'side-lower':'#1D9E75',
  'side-upper':'#BA7517',
};

// Deterministic "already booked" berths — stable per coach index
function getBookedSet(classCode, coachIdx) {
  const cfg = COACH_CONFIGS[classCode] || COACH_CONFIGS.SL;
  const bpb = cfg.hasMiddle ? 6 : 4;
  const booked = new Set();
  for (let b = 0; b < cfg.bays; b++) {
    const base = b * bpb;
    for (let s = 1; s <= bpb; s++) {
      if ((base + s + coachIdx * 3) % 4 === 0) booked.add(`M${base + s}`);
    }
    const sBase = b * 2;
    for (let s = 1; s <= 2; s++) {
      if ((sBase + s + coachIdx * 2) % 5 === 0) booked.add(`S${sBase + s}`);
    }
  }
  return booked;
}

// ─── Single berth tile ───────────────────────────────────────────────────────
function Berth({ num, berthType, isBooked, isSelected, onClick }) {
  const shortLabel = { lower:'LWR', middle:'MDL', upper:'UPR', 'side-lower':'S-L', 'side-upper':'S-U' }[berthType] || '';
  const accentColor = BERTH_COLORS[berthType] || '#aaa';

  return (
    <div
      onClick={() => !isBooked && onClick()}
      title={`${berthType} #${num}${isBooked ? ' (booked)' : ''}`}
      style={{
        width: '44px', height: '36px', borderRadius: '5px',
        border: `1px solid ${isSelected ? '#185FA5' : '#e2e8f0'}`,
        borderLeft: `3px solid ${isSelected ? '#185FA5' : accentColor}`,
        background: isBooked ? '#f1f5f9' : isSelected ? '#185FA5' : '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: isBooked ? 'not-allowed' : 'pointer',
        opacity: isBooked ? 0.42 : 1,
        transition: 'transform 0.1s',
        userSelect: 'none', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!isBooked) e.currentTarget.style.transform = 'scale(1.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1, color: isSelected ? '#fff' : isBooked ? '#94a3b8' : '#1e293b' }}>{num}</span>
      <span style={{ fontSize: '8px', color: isSelected ? '#bfdbfe' : '#94a3b8', marginTop: '1px' }}>{shortLabel}</span>
    </div>
  );
}

// ─── Compartment seat map ─────────────────────────────────────────────────────
function SeatMap({ classCode, passengers, onSeatsConfirmed }) {
  const cfg = COACH_CONFIGS[classCode] || COACH_CONFIGS.SL;
  const [coachIdx, setCoachIdx] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const booked = getBookedSet(classCode, coachIdx);
  const bpb = cfg.hasMiddle ? 6 : 4;

  const toggle = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= passengers) { const arr = [...next]; arr.shift(); arr.push(id); return new Set(arr); }
      next.add(id); return next;
    });
  }, [passengers]);

  const switchCoach = (i) => { setCoachIdx(i); setSelected(new Set()); };

  // Count available
  let availCount = 0;
  for (let b = 0; b < cfg.bays; b++) {
    for (let s = 1; s <= bpb; s++) { if (!booked.has(`M${b * bpb + s}`)) availCount++; }
    for (let s = 1; s <= 2; s++) { if (!booked.has(`S${b * 2 + s}`)) availCount++; }
  }

  const canConfirm = selected.size === passengers;

  // Build bay data
  const bays = Array.from({ length: cfg.bays }, (_, b) => {
    const base = b * bpb;
    const leftNums  = cfg.hasMiddle ? [base+1, base+2, base+3] : [base+1, base+2];
    const rightNums = cfg.hasMiddle ? [base+4, base+5, base+6] : [base+3, base+4];
    const cols = cfg.hasMiddle ? ['lower','middle','upper'] : ['lower','upper'];
    return { b, leftNums, rightNums, types: cols, sideNums: [b*2+1, b*2+2] };
  });

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '0.93rem', fontWeight: 700, color: '#0f2e5a' }}>Choose Your Berths</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Select {passengers} berth{passengers > 1 ? 's' : ''} — {selected.size}/{passengers} selected
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
          {[['#1D9E75','Lower'],['#185FA5','Middle'],['#BA7517','Upper'],['#f1f5f9','Booked'],['#185FA5','Selected']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: 11, height: 11, background: c, borderRadius: 2, display: 'inline-block', border: l === 'Booked' ? '1px solid #cbd5e1' : 'none' }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Coach selector tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {cfg.coaches.map((c, i) => (
          <button key={c} onClick={() => switchCoach(i)} style={{
            padding: '3px 11px', borderRadius: '4px', fontSize: '12px',
            border: `1px solid ${i === coachIdx ? '#185FA5' : '#e2e8f0'}`,
            background: i === coachIdx ? '#EBF4FF' : '#fff',
            color: i === coachIdx ? '#185FA5' : '#475569',
            fontWeight: i === coachIdx ? 700 : 400, cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      {/* Coach header strip */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px 8px 0 0', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ fontWeight: 600, color: '#334155' }}>Coach {cfg.coaches[coachIdx]} — {cfg.label}</span>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{availCount} seats available</span>
      </div>

      {/* Compartment body */}
      <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#f8fafc', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, padding: '10px 10px', minWidth: 'max-content' }}>

          {/* Main bays column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {bays.map(({ b, leftNums, rightNums, types }) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #e8edf3', borderRadius: '6px', padding: '5px 6px' }}>
                <div style={{ fontSize: '9px', color: '#b0bec5', writingMode: 'vertical-rl', minWidth: '12px' }}>B{b+1}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {leftNums.map((n, i) => <Berth key={n} num={n} berthType={types[i]} isBooked={booked.has(`M${n}`)} isSelected={selected.has(`M${n}`)} onClick={() => toggle(`M${n}`)} />)}
                </div>
                <div style={{ width: 5 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {rightNums.map((n, i) => <Berth key={n} num={n} berthType={types[i]} isBooked={booked.has(`M${n}`)} isSelected={selected.has(`M${n}`)} onClick={() => toggle(`M${n}`)} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Aisle divider */}
          <div style={{ width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#cbd5e1', writingMode: 'vertical-rl', letterSpacing: '1.5px', flexShrink: 0 }}>
            AISLE
          </div>

          {/* Side berths column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {bays.map(({ b, sideNums }) => (
              <div key={b} style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: '6px', padding: '5px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ fontSize: '8px', color: '#b0bec5' }}>SIDE</div>
                <Berth num={sideNums[0]} berthType="side-lower" isBooked={booked.has(`S${sideNums[0]}`)} isSelected={selected.has(`S${sideNums[0]}`)} onClick={() => toggle(`S${sideNums[0]}`)} />
                <Berth num={sideNums[1]} berthType="side-upper" isBooked={booked.has(`S${sideNums[1]}`)} isSelected={selected.has(`S${sideNums[1]}`)} onClick={() => toggle(`S${sideNums[1]}`)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ marginTop: '8px', padding: '9px 13px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#475569' }}>
          {selected.size === 0
            ? `Tap berths to choose (${passengers} needed)`
            : <><span style={{ fontWeight: 700, color: '#1e293b' }}>{[...selected].join(', ')}</span> — {selected.size}/{passengers} selected</>
          }
        </span>
        <button
          disabled={!canConfirm}
          onClick={() => onSeatsConfirmed([...selected], cfg.coaches[coachIdx])}
          style={{
            background: canConfirm ? '#185FA5' : '#e2e8f0',
            color: canConfirm ? '#fff' : '#94a3b8',
            border: 'none', borderRadius: '6px', padding: '7px 18px',
            fontSize: '13px', fontWeight: 600,
            cursor: canConfirm ? 'pointer' : 'not-allowed', transition: 'background 0.15s',
          }}
        >
          {canConfirm ? `Lock ${passengers} Berth${passengers > 1 ? 's' : ''}` : `Pick ${passengers - selected.size} more`}
        </button>
      </div>
    </div>
  );
}

// ─── Seats page ───────────────────────────────────────────────────────────────
export default function Seats({ onProceed, onBack }) {
  const { selectedTrain, seatSelection, setSeatSelection, searchParams, socket } = useBooking();
  const [seatsConfirmed, setSeatsConfirmed] = useState(false);
  const [confirmedBerths, setConfirmedBerths] = useState([]);
  const [confirmedCoach, setConfirmedCoach]   = useState('');
  const [liveClasses, setLiveClasses] = useState(null);

  useEffect(() => {
    if (!selectedTrain?.id || !socket) return;
    socket.emit('join-train', selectedTrain.id);
    socket.on('seat-update', ({ trainId, classes }) => {
      if (trainId === selectedTrain.id) setLiveClasses(classes);
    });
    return () => {
      socket.emit('leave-train', selectedTrain.id);
      socket.off('seat-update');
    };
  }, [selectedTrain?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedTrain) return null;

  const displayClasses = liveClasses || selectedTrain.classes;

  const { classType, passengers, berthPreference } = seatSelection;
  const selectedClass = displayClasses.find(c => c.code === classType);
  const basePrice  = selectedClass ? selectedClass.price : 0;
  const serviceFee = passengers > 0 ? 35 * passengers : 0;
  const gst        = Math.round(basePrice * passengers * 0.05);
  const grandTotal = basePrice * passengers + serviceFee + gst;

  const setClass      = (code) => { setSeatSelection(s => ({ ...s, classType: code })); setSeatsConfirmed(false); setConfirmedBerths([]); setConfirmedCoach(''); };
  const setPassengers = (n)    => { setSeatSelection(s => ({ ...s, passengers: Math.max(1, Math.min(6, n)) })); setSeatsConfirmed(false); setConfirmedBerths([]); };
  const setBerth      = (b)    => setSeatSelection(s => ({ ...s, berthPreference: b }));

  const showSeatMap = classType && !!COACH_CONFIGS[classType];
  const canProceed  = !!classType && passengers >= 1 && (!showSeatMap || seatsConfirmed);

  const handleSeatsConfirmed = (berths, coach) => {
    setConfirmedBerths(berths);
    setConfirmedCoach(coach);
    setSeatsConfirmed(true);
    setSeatSelection(s => ({ ...s, selectedBerths: berths, selectedCoach: coach }));
  };

  return (
    <div className="seats-page">
      {/* Journey banner */}
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

      {/* Class cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>Select <span>Class</span></h2>
        <p className="section-subtitle">Choose your preferred travel class</p>
      </div>
      <div className="seats-grid">
        {displayClasses.map(cls => {
          const info = CLASS_INFO[cls.code] || { name: cls.name, desc: '', icon: '' };
          const isWaiting = cls.status.startsWith('WL');
          return (
            <div key={cls.code} className={`seat-class-card ${classType === cls.code ? 'selected' : ''}`} onClick={() => setClass(cls.code)}>
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

      {/* Passenger count + berth preference */}
      <div className="passengers-section">
        <h3>Passenger Details</h3>
        <div className="passenger-counter">
          <button className="counter-btn" onClick={() => setPassengers(passengers - 1)}>−</button>
          <div className="counter-val">{passengers}</div>
          <button className="counter-btn" onClick={() => setPassengers(passengers + 1)}>+</button>
          <div className="counter-label">Passenger{passengers > 1 ? 's' : ''} <span style={{ fontSize: '0.78rem', color: 'var(--gray-300)' }}>(Max 6)</span></div>
        </div>
        {classType && ['SL','2A','3A','1A'].includes(classType) && (
          <div className="berth-prefs">
            <h4>Berth Preference</h4>
            <div className="berth-options">
              {BERTH_OPTIONS.map(b => (
                <button key={b} className={`berth-chip ${berthPreference === b ? 'selected' : ''}`} onClick={() => setBerth(b)}>{b}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SEAT MAP SECTION ──────────────────────────────────────── */}
      {showSeatMap && (
        <div style={{
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '14px',
          padding: '1.25rem 1.25rem 1rem', marginBottom: '1.5rem',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ background: '#EBF4FF', color: '#185FA5', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
              COACH SEAT MAP
            </span>
            {seatsConfirmed && (
              <span style={{ background: '#DCFCE7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                ✓ {confirmedBerths.length} berth{confirmedBerths.length > 1 ? 's' : ''} locked — Coach {confirmedCoach}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0' }}>
            Top-view of a real Indian Railways {COACH_CONFIGS[classType]?.label} compartment
          </p>

          <SeatMap classCode={classType} passengers={passengers} onSeatsConfirmed={handleSeatsConfirmed} />
        </div>
      )}

      {/* Fare summary */}
      <div className="price-summary-card">
        <h3>Fare Summary</h3>
        {seatsConfirmed && confirmedBerths.length > 0 && (
          <div className="price-row">
            <span className="label" style={{ fontSize: '0.78rem', color: '#475569' }}>
              Coach {confirmedCoach} — Berths: {confirmedBerths.join(', ')}
            </span>
          </div>
        )}
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
          <span>₹{gst.toLocaleString('en-IN')}</span>
        </div>
        <div className="price-row total">
          <span className="label">Total Payable</span>
          <span>₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <button
        className="proceed-btn"
        disabled={!canProceed}
        onClick={() => canProceed && onProceed(grandTotal)}
      >
        {!classType
          ? 'Please Select a Class to Continue'
          : showSeatMap && !seatsConfirmed
            ? 'Please Select Your Berths on the Map Above'
            : `Proceed to Book — ₹${grandTotal.toLocaleString('en-IN')}`
        }
      </button>

      <button onClick={onBack} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.9rem', padding: '0.5rem' }}>
        ← Back to Train List
      </button>
    </div>
  );
}
