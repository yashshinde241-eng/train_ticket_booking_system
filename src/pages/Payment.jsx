import { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const API = 'http://localhost:5000';

export default function Payment({ totalFare, onSuccess, onBack }) {
  const { user } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ amount: totalFare }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Could not create order');

      // 2. Open Razorpay checkout popup
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'IRCTC Train Booking',
        description: 'Train Ticket Payment',
        order_id:    order.orderId,
        prefill: { name: user.username, email: user.email || '' },
        theme: { color: '#1e3a5f' },
        handler: async (response) => {
          // 3. Verify payment on server
          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
            body: JSON.stringify(response),
          });
          const verify = await verifyRes.json();
          if (!verifyRes.ok) { setError('Payment verification failed. Please contact support.'); setLoading(false); return; }
          // 4. Payment verified — proceed to confirmation
          onSuccess(verify.paymentId);
        },
        modal: {
          ondismiss: () => { setLoading(false); setError('Payment cancelled. Your ticket has not been booked.'); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a5276)', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Rajdhani, sans-serif' }}>
            IR<span style={{ color: '#f59e0b' }}>CTC</span>
          </div>
          <div style={{ color: '#93c5fd', fontSize: '0.9rem', marginTop: '0.25rem' }}>Secure Payment</div>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Amount */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Total Amount to Pay</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a5f', fontFamily: 'Rajdhani, sans-serif' }}>
              ₹{totalFare?.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Payment methods info */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Accepted Payment Methods
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['💳 Credit/Debit Card', '📱 UPI', '🏦 Net Banking', '👛 Wallet'].map(m => (
                <span key={m} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Security badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>256-bit SSL encrypted. Powered by Razorpay.</span>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#dc2626' }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%', padding: '1rem', border: 'none', borderRadius: '10px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#2563eb)',
              color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.5px',
            }}
          >
            {loading ? '⏳ Opening Payment...' : `🔒 Pay ₹${totalFare?.toLocaleString('en-IN')}`}
          </button>

          <button onClick={onBack} style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
        Test mode: Use card <strong>4111 1111 1111 1111</strong>, any future expiry, any CVV. UPI: <strong>success@razorpay</strong>
      </p>
    </div>
  );
}
