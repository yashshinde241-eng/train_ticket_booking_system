import { useEffect, useState } from 'react';
import { useBooking } from '../context/BookingContext';

const API = 'http://localhost:5000';

const statCard = (label, value, color, icon) => (
  <div style={{ background:'#fff', borderRadius:'14px', padding:'1.25rem 1.5rem', border:'1px solid #e2e8f0', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', borderLeft:`4px solid ${color}` }}>
    <div style={{ fontSize:'1.8rem', marginBottom:'0.25rem' }}>{icon}</div>
    <div style={{ fontSize:'1.9rem', fontWeight:800, color, fontFamily:'Rajdhani, sans-serif' }}>{value}</div>
    <div style={{ fontSize:'0.82rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
  </div>
);

export default function AdminDashboard() {
  const { user } = useBooking();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('overview');

  // For cancel/refund tab
  const [cancelPnr,    setCancelPnr]    = useState('');
  const [cancelResult, setCancelResult] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState('');

  const loadStats = () => {
    if (!user?.token) return;
    setLoading(true);
    fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error); else setStats(data); })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdminCancel = async () => {
    if (!cancelPnr.trim()) { setCancelError('Enter a PNR number.'); return; }
    setCancelling(true); setCancelError(''); setCancelResult(null);
    try {
      const res = await fetch(`${API}/api/admin/tickets/${cancelPnr.trim()}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (!res.ok) { setCancelError(data.error); return; }
      setCancelResult(data);
      // Refresh stats
      loadStats();
    } catch { setCancelError('Request failed.'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><div className="loading-text">Loading dashboard...</div></div>;
  if (error)   return <div style={{ padding:'2rem', color:'#dc2626', textAlign:'center' }}>⚠ {error}</div>;

  const tabStyle = (t) => ({
    padding:'0.6rem 1.4rem', borderRadius:'8px', fontWeight:700, fontSize:'0.9rem',
    cursor:'pointer', border:'none',
    background: tab === t ? '#1e3a5f' : '#f1f5f9',
    color:      tab === t ? '#fff'    : '#475569',
  });

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontFamily:'Rajdhani, sans-serif', fontSize:'2rem', fontWeight:800, color:'#1e3a5f', margin:0 }}>🛡 Admin Dashboard</h2>
        <p style={{ color:'#64748b', marginTop:'0.25rem' }}>Logged in as <strong>{user?.username}</strong></p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem', flexWrap:'wrap' }}>
        <button style={tabStyle('overview')} onClick={() => setTab('overview')}>📊 Overview</button>
        <button style={tabStyle('tickets')}  onClick={() => setTab('tickets')}>🎫 Manage Tickets</button>
        <button style={tabStyle('logs')}     onClick={() => setTab('logs')}>📋 Booking Logs</button>
        <button style={tabStyle('users')}    onClick={() => setTab('users')}>👥 Users</button>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
            {statCard('Total Users',    stats.totalUsers,       '#3b82f6', '👥')}
            {statCard('Total Bookings', stats.totalTickets,     '#8b5cf6', '🎫')}
            {statCard('Confirmed',      stats.confirmedTickets, '#10b981', '✓')}
            {statCard('Cancelled',      stats.cancelledTickets, '#ef4444', '✗')}
            {statCard('Revenue',        `₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`, '#f59e0b', '💰')}
          </div>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'1.5rem', border:'1px solid #e2e8f0' }}>
            <div style={{ fontWeight:700, color:'#1e3a5f', marginBottom:'1rem' }}>📅 Bookings — Last 7 Days</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'0.75rem', height:'120px' }}>
              {stats.dailyStats?.map(d => {
                const max = Math.max(...stats.dailyStats.map(x => x.count), 1);
                const h   = Math.max((d.count / max) * 100, 4);
                return (
                  <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#1e3a5f' }}>{d.count}</div>
                    <div style={{ width:'100%', height:`${h}px`, background:'linear-gradient(180deg,#3b82f6,#1e3a5f)', borderRadius:'4px 4px 0 0' }} />
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8', textAlign:'center' }}>
                      {new Date(d.date).toLocaleDateString('en-IN', { month:'short', day:'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MANAGE TICKETS — Cancel + Refund */}
      {tab === 'tickets' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {/* Cancel by PNR */}
          <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', padding:'1.5rem' }}>
            <div style={{ fontWeight:700, color:'#1e3a5f', fontSize:'1.1rem', marginBottom:'0.5rem' }}>✗ Cancel Ticket & Simulate Refund</div>
            <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1rem' }}>Enter any user's PNR to cancel their ticket and trigger a refund simulation + cancellation email.</p>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <input
                type="text" placeholder="Enter PNR number" value={cancelPnr}
                onChange={e => { setCancelPnr(e.target.value); setCancelError(''); setCancelResult(null); }}
                style={{ flex:1, minWidth:'200px', padding:'0.75rem 1rem', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.95rem', outline:'none' }}
              />
              <button onClick={handleAdminCancel} disabled={cancelling} style={{
                padding:'0.75rem 1.5rem', border:'none', borderRadius:'8px',
                background: cancelling ? '#94a3b8' : '#dc2626', color:'#fff',
                fontWeight:700, fontSize:'0.95rem', cursor: cancelling ? 'not-allowed' : 'pointer',
              }}>
                {cancelling ? '⏳ Processing...' : '✗ Cancel & Refund'}
              </button>
            </div>
            {cancelError && <div style={{ marginTop:'0.75rem', color:'#dc2626', fontSize:'0.85rem' }}>⚠ {cancelError}</div>}
            {cancelResult && (
              <div style={{ marginTop:'1rem', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'10px', padding:'1rem' }}>
                <div style={{ fontWeight:700, color:'#15803d', marginBottom:'0.5rem' }}>✓ Ticket Cancelled Successfully</div>
                <div style={{ fontSize:'0.85rem', color:'#334155', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <span><strong>PNR:</strong> {cancelResult.ticket?.pnr}</span>
                  <span><strong>User:</strong> {cancelResult.ticket?.username}</span>
                  <span><strong>Train:</strong> {cancelResult.ticket?.trainName}</span>
                  <span><strong>Refund Amount:</strong> <span style={{ color:'#15803d', fontWeight:700 }}>₹{cancelResult.refundAmount?.toLocaleString('en-IN')}</span></span>
                  <span><strong>Refund ID:</strong> <span style={{ fontFamily:'monospace', color:'#1e3a5f' }}>{cancelResult.refundId}</span></span>
                  <span style={{ color:'#64748b', fontSize:'0.8rem' }}>Cancellation email sent to user. Refund will reflect in 5–7 business days.</span>
                </div>
              </div>
            )}
          </div>

          {/* All tickets table */}
          <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', fontWeight:700, color:'#1e3a5f' }}>
              All Tickets ({stats.allTickets?.length})
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['PNR','User','Train','Route','Date','Class','Fare','Status','Payment ID'].map(h => (
                      <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontWeight:700, color:'#475569', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.allTickets?.map((t, i) => (
                    <tr key={t.pnr} style={{ borderTop:'1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={{ padding:'0.65rem 1rem', fontFamily:'monospace', fontWeight:700, color:'#1e3a5f', whiteSpace:'nowrap' }}>{t.pnr}</td>
                      <td style={{ padding:'0.65rem 1rem', fontWeight:600 }}>{t.username}</td>
                      <td style={{ padding:'0.65rem 1rem', whiteSpace:'nowrap' }}>{t.trainName}</td>
                      <td style={{ padding:'0.65rem 1rem', whiteSpace:'nowrap' }}>{t.from} → {t.to}</td>
                      <td style={{ padding:'0.65rem 1rem', whiteSpace:'nowrap' }}>{t.date}</td>
                      <td style={{ padding:'0.65rem 1rem' }}><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.15rem 0.5rem', borderRadius:'4px', fontWeight:700, fontSize:'0.78rem' }}>{t.classCode}</span></td>
                      <td style={{ padding:'0.65rem 1rem', fontWeight:700 }}>₹{t.totalFare?.toLocaleString('en-IN')}</td>
                      <td style={{ padding:'0.65rem 1rem' }}>
                        <span style={{ padding:'0.15rem 0.6rem', borderRadius:'99px', fontSize:'0.75rem', fontWeight:700, background:t.status==='CONFIRMED'?'#dcfce7':'#fee2e2', color:t.status==='CONFIRMED'?'#15803d':'#dc2626' }}>{t.status}</span>
                      </td>
                      <td style={{ padding:'0.65rem 1rem', fontFamily:'monospace', fontSize:'0.78rem', color:'#64748b' }}>{t.paymentId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING LOGS */}
      {tab === 'logs' && (
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', fontWeight:700, color:'#1e3a5f' }}>Recent Booking Logs ({stats.recentLogs?.length})</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['PNR','User','Train','Route','Date','Class','Pax','Fare','Status','Logged At'].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontWeight:700, color:'#475569', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs?.map((log, i) => (
                  <tr key={log._id} style={{ borderTop:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'0.65rem 1rem', fontFamily:'monospace', fontWeight:700, color:'#1e3a5f' }}>{log.pnr}</td>
                    <td style={{ padding:'0.65rem 1rem', fontWeight:600 }}>{log.username}</td>
                    <td style={{ padding:'0.65rem 1rem' }}>{log.trainName}</td>
                    <td style={{ padding:'0.65rem 1rem', whiteSpace:'nowrap' }}>{log.from} → {log.to}</td>
                    <td style={{ padding:'0.65rem 1rem', whiteSpace:'nowrap' }}>{log.date}</td>
                    <td style={{ padding:'0.65rem 1rem' }}><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.15rem 0.5rem', borderRadius:'4px', fontWeight:700, fontSize:'0.78rem' }}>{log.classCode}</span></td>
                    <td style={{ padding:'0.65rem 1rem', textAlign:'center' }}>{log.passengers}</td>
                    <td style={{ padding:'0.65rem 1rem', fontWeight:700 }}>₹{log.totalFare?.toLocaleString('en-IN')}</td>
                    <td style={{ padding:'0.65rem 1rem' }}><span style={{ padding:'0.15rem 0.6rem', borderRadius:'99px', fontSize:'0.75rem', fontWeight:700, background:log.status==='CONFIRMED'?'#dcfce7':'#fee2e2', color:log.status==='CONFIRMED'?'#15803d':'#dc2626' }}>{log.status}</span></td>
                    <td style={{ padding:'0.65rem 1rem', color:'#94a3b8', whiteSpace:'nowrap' }}>{new Date(log.loggedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f1f5f9', fontWeight:700, color:'#1e3a5f' }}>Registered Users ({stats.recentUsers?.length})</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Username','Email','Role','Registered On'].map(h => (
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontWeight:700, color:'#475569', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers?.map((u, i) => (
                  <tr key={u._id} style={{ borderTop:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'0.65rem 1rem', color:'#94a3b8' }}>{i+1}</td>
                    <td style={{ padding:'0.65rem 1rem', fontWeight:700, color:'#1e3a5f' }}>👤 {u.username}</td>
                    <td style={{ padding:'0.65rem 1rem', color:'#475569' }}>{u.email}</td>
                    <td style={{ padding:'0.65rem 1rem' }}><span style={{ padding:'0.15rem 0.6rem', borderRadius:'99px', fontSize:'0.75rem', fontWeight:700, background:'#eff6ff', color:'#1d4ed8' }}>{u.role||'user'}</span></td>
                    <td style={{ padding:'0.65rem 1rem', color:'#94a3b8' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
