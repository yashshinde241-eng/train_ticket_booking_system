import { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const GENDERS = ['Male', 'Female', 'Other'];

export default function PassengerDetails({ onConfirm, onBack }) {
  const { seatSelection, setSeatSelection, selectedTrain, searchParams, user } = useBooking();
  const { passengers, selectedBerths, selectedCoach, classType } = seatSelection;

  const [details, setDetails] = useState(
    Array.from({ length: passengers }, () => ({ name: '', age: '', gender: 'Male' }))
  );
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [emailError, setEmailError]     = useState('');
  const [errors, setErrors] = useState(Array(passengers).fill({}));

  const handleChange = (index, field, value) => {
    const updated = [...details];
    updated[index] = { ...updated[index], [field]: value };
    setDetails(updated);
    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], [field]: '' };
    setErrors(newErrors);
  };

  const validate = () => {
    let valid = true;

    // Validate contact email
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRe.test(contactEmail)) {
      setEmailError('Enter a valid email address for confirmation.');
      valid = false;
    } else {
      setEmailError('');
    }

    const newErrors = details.map(p => ({
      name:   !p.name.trim() ? 'Name is required' : '',
      age:    !p.age || isNaN(p.age) || +p.age < 1 || +p.age > 120 ? 'Enter valid age (1–120)' : '',
      gender: !p.gender ? 'Select gender' : '',
    }));
    setErrors(newErrors);
    if (newErrors.some(e => e.name || e.age || e.gender)) valid = false;

    return valid;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSeatSelection(prev => ({
      ...prev,
      passengerNames:   details.map(d => d.name),
      passengerDetails: details,
      contactEmail,
    }));
    onConfirm(details);
  };

  const selectedClass = selectedTrain?.classes.find(c => c.code === classType);
  const baseFare  = selectedClass?.price || 0;
  const totalFare = baseFare * passengers;

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.95rem',
    border: `1px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`, borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box',
  });

  return (
    <div className="passenger-details-page">
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
            Passenger Details
          </h2>
          <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Enter details for all {passengers} passenger{passengers > 1 ? 's' : ''}
          </p>
        </div>

        {/* Journey Summary */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            {[
              ['Journey', `${searchParams.from} → ${searchParams.to}`],
              ['Train',   `${selectedTrain?.name} (${selectedTrain?.number})`],
              ['Class',   `${classType} - ${selectedCoach}`],
              ['Berths',  selectedBerths.join(', ')],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Email */}
        <div style={{
          background: '#fff', border: `1px solid ${emailError ? '#ef4444' : '#e2e8f0'}`,
          borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
            📧 Confirmation Email
          </label>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem', marginTop: 0 }}>
            Booking confirmation will be sent to this email address.
          </p>
          <input
            type="email"
            placeholder="Enter email for booking confirmation"
            value={contactEmail}
            onChange={e => { setContactEmail(e.target.value); setEmailError(''); }}
            style={inputStyle(!!emailError)}
          />
          {emailError && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem' }}>{emailError}</div>}
        </div>

        {/* Passenger Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {details.map((p, i) => (
            <div key={i} style={{
              background: '#fff',
              border: `1px solid ${(errors[i]?.name || errors[i]?.age) ? '#ef4444' : '#e2e8f0'}`,
              borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--navy)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy-dark)' }}>Passenger {i + 1}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Berth: {selectedBerths[i] || 'Auto-assigned'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Full Name</label>
                  <input type="text" placeholder="Enter name" value={p.name}
                    onChange={e => handleChange(i, 'name', e.target.value)}
                    style={inputStyle(errors[i]?.name)} />
                  {errors[i]?.name && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors[i].name}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Age</label>
                  <input type="number" placeholder="Age" min="1" max="120" value={p.age}
                    onChange={e => handleChange(i, 'age', e.target.value)}
                    style={inputStyle(errors[i]?.age)} />
                  {errors[i]?.age && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors[i].age}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Gender</label>
                  <select value={p.gender} onChange={e => handleChange(i, 'gender', e.target.value)}
                    style={{ ...inputStyle(false), background: '#fff', cursor: 'pointer' }}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fare Summary */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>Total Fare</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>₹{totalFare.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#0369a1' }}>
              {passengers} passenger{passengers > 1 ? 's' : ''} × ₹{baseFare.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onBack} style={{
            padding: '0.875rem 1.75rem', border: '1px solid #e2e8f0', borderRadius: '8px',
            background: '#fff', color: '#475569', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
          }}>← Back</button>
          <button onClick={handleSubmit} style={{
            padding: '0.875rem 2rem', border: 'none', borderRadius: '8px',
            background: 'var(--navy)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
          }}>Continue to Payment →</button>
        </div>
      </div>
    </div>
  );
}
