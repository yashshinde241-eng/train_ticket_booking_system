import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import Train from './models/Train.js';
import Ticket from './models/Ticket.js';
import User from './models/User.js';
import BookingLog from './models/BookingLog.js';

const app    = express();
const server = createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const JWT_SECRET = 'irctc_jwt_secret_key_2024';

app.use(cors());
app.use(express.json());

// ── Razorpay ──────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb://127.0.0.1:27017/train-booking';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.deleteMany({});
      await BookingLog.deleteMany({});
      console.log('Cleared old data for re-seed');
    }
    seedTrains();
    seedSyntheticData();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// ── Email ─────────────────────────────────────────────────────────────────────
const useGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_PASS &&
  process.env.GMAIL_USER !== 'your_gmail@gmail.com');

let transporter;
if (useGmail) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  console.log('Mailer: Gmail SMTP ready for', process.env.GMAIL_USER);
} else {
  nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host, port: account.smtp.port, secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    console.log('Mailer: Ethereal ready —', account.user);
  });
}

const sendEmail = async (to, subject, html) => {
  if (!transporter) return null;
  const from = useGmail ? `"IRCTC Booking" <${process.env.GMAIL_USER}>` : '"IRCTC" <noreply@irctc.in>';
  const info = await transporter.sendMail({ from, to, subject, html });
  const preview = !useGmail ? nodemailer.getTestMessageUrl(info) : null;
  if (preview) console.log('Email preview:', preview);
  else console.log('Email sent to:', to);
  return preview;
};

const bookingConfirmHtml = (ticket) => `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#1e3a5f;padding:1.5rem;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:1.8rem">IR<span style="color:#f59e0b">CTC</span></h1>
      <p style="color:#93c5fd;margin:0.25rem 0 0">Booking Confirmation</p>
    </div>
    <div style="padding:1.5rem">
      <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:1rem;margin-bottom:1.5rem;text-align:center">
        <strong style="color:#15803d;font-size:1.1rem">✓ Booking Confirmed! Payment Received.</strong>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr><td style="padding:0.5rem;color:#64748b;width:40%">PNR Number</td><td style="padding:0.5rem;font-weight:700">${ticket.pnr}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Train</td><td style="padding:0.5rem;font-weight:700">${ticket.trainName} (${ticket.trainNumber})</td></tr>
        <tr><td style="padding:0.5rem;color:#64748b">Journey</td><td style="padding:0.5rem;font-weight:700">${ticket.from} → ${ticket.to}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Date</td><td style="padding:0.5rem;font-weight:700">${ticket.date}</td></tr>
        <tr><td style="padding:0.5rem;color:#64748b">Class</td><td style="padding:0.5rem;font-weight:700">${ticket.classCode}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Passengers</td><td style="padding:0.5rem;font-weight:700">${ticket.passengers}</td></tr>
        <tr><td style="padding:0.5rem;color:#64748b">Total Fare</td><td style="padding:0.5rem;font-weight:700;color:#1e3a5f">₹${Number(ticket.totalFare).toLocaleString('en-IN')}</td></tr>
        ${ticket.paymentId ? `<tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Payment ID</td><td style="padding:0.5rem;font-weight:700;color:#15803d">${ticket.paymentId}</td></tr>` : ''}
      </table>
      <p style="margin-top:1.5rem;font-size:0.8rem;color:#94a3b8">Please carry a valid photo ID during your journey.</p>
    </div>
  </div>`;

const cancellationHtml = (ticket) => `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#1e3a5f;padding:1.5rem;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:1.8rem">IR<span style="color:#f59e0b">CTC</span></h1>
      <p style="color:#93c5fd;margin:0.25rem 0 0">Cancellation Confirmation</p>
    </div>
    <div style="padding:1.5rem">
      <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:1rem;margin-bottom:1.5rem;text-align:center">
        <strong style="color:#dc2626;font-size:1.1rem">✗ Ticket Cancelled</strong>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr><td style="padding:0.5rem;color:#64748b;width:40%">PNR Number</td><td style="padding:0.5rem;font-weight:700">${ticket.pnr}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Train</td><td style="padding:0.5rem;font-weight:700">${ticket.trainName}</td></tr>
        <tr><td style="padding:0.5rem;color:#64748b">Journey</td><td style="padding:0.5rem;font-weight:700">${ticket.from} → ${ticket.to}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:0.5rem;color:#64748b">Date</td><td style="padding:0.5rem;font-weight:700">${ticket.date}</td></tr>
        <tr><td style="padding:0.5rem;color:#64748b">Refund Amount</td><td style="padding:0.5rem;font-weight:700;color:#15803d">₹${Number(ticket.totalFare).toLocaleString('en-IN')}</td></tr>
      </table>
      <p style="margin-top:1.5rem;font-size:0.8rem;color:#94a3b8">Refund will be processed within 5–7 business days.</p>
    </div>
  </div>`;

// ── Socket.io — live seat updates ─────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-train', (trainId) => socket.join(`train-${trainId}`));
  socket.on('leave-train', (trainId) => socket.leave(`train-${trainId}`));
});

// Broadcast seat update to all users watching a train
const broadcastSeatUpdate = async (trainId) => {
  const train = await Train.findOne({ id: trainId });
  if (train) io.to(`train-${trainId}`).emit('seat-update', { trainId, classes: train.classes });
};

// ── Seed trains ───────────────────────────────────────────────────────────────
const seedTrains = async () => {
  try {
    if (await Train.countDocuments() > 0) return;
    await Train.insertMany([
      { id:'T001', number:'12951', name:'Rajdhani Express', type:'superfast', from:{code:'NDLS',name:'New Delhi'}, to:{code:'MMCT',name:'Mumbai Central'}, departure:'16:35', arrival:'08:15', duration:'15h 40m', stops:5, days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], classes:[{code:'1A',name:'First AC',price:4560,available:12,status:'AVL'},{code:'2A',name:'Second AC',price:2680,available:34,status:'AVL'},{code:'3A',name:'Third AC',price:1865,available:0,status:'WL 14'},{code:'SL',name:'Sleeper',price:720,available:98,status:'AVL'}] },
      { id:'T002', number:'12953', name:'August Kranti Rajdhani', type:'superfast', from:{code:'NDLS',name:'New Delhi'}, to:{code:'BDTS',name:'Mumbai Bandra'}, departure:'17:40', arrival:'10:55', duration:'17h 15m', stops:6, days:['Mon','Thu'], classes:[{code:'1A',name:'First AC',price:4890,available:4,status:'AVL'},{code:'2A',name:'Second AC',price:2870,available:21,status:'AVL'},{code:'3A',name:'Third AC',price:1960,available:63,status:'AVL'}] },
      { id:'T003', number:'12903', name:'Golden Temple Mail', type:'express', from:{code:'BCT',name:'Mumbai Central'}, to:{code:'ASR',name:'Amritsar'}, departure:'21:20', arrival:'21:35', duration:'24h 15m', stops:12, days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], classes:[{code:'2A',name:'Second AC',price:2210,available:8,status:'AVL'},{code:'3A',name:'Third AC',price:1520,available:45,status:'AVL'},{code:'SL',name:'Sleeper',price:570,available:0,status:'WL 3'}] },
      { id:'T004', number:'12259', name:'Duronto Express', type:'superfast', from:{code:'PUNE',name:'Pune Jn'}, to:{code:'NDLS',name:'New Delhi'}, departure:'11:05', arrival:'11:25', duration:'24h 20m', stops:2, days:['Tue','Thu','Sat'], classes:[{code:'1A',name:'First AC',price:5120,available:6,status:'AVL'},{code:'2A',name:'Second AC',price:2950,available:18,status:'AVL'},{code:'3A',name:'Third AC',price:1990,available:72,status:'AVL'}] },
      { id:'T005', number:'11077', name:'Jhelum Express', type:'express', from:{code:'PUNE',name:'Pune Jn'}, to:{code:'ASR',name:'Amritsar'}, departure:'18:10', arrival:'23:55', duration:'29h 45m', stops:18, days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], classes:[{code:'3A',name:'Third AC',price:1680,available:28,status:'AVL'},{code:'SL',name:'Sleeper',price:610,available:0,status:'WL 22'},{code:'2S',name:'2nd Sitting',price:285,available:200,status:'AVL'}] },
    ]);
    console.log('Seeded trains.');
  } catch (err) { console.error('Seed trains error:', err); }
};

const seedSyntheticData = async () => {
  try {
    if (await User.countDocuments() > 0) return;
    const users = [
      { username:'admin',        email:'admin@irctc.in',     password:'adminpass', role:'admin' },
      { username:'rahul_sharma', email:'rahul@example.com',  password:'pass1234' },
      { username:'priya_patel',  email:'priya@example.com',  password:'pass1234' },
      { username:'amit_kumar',   email:'amit@example.com',   password:'pass1234' },
      { username:'sneha_gupta',  email:'sneha@example.com',  password:'pass1234' },
      { username:'vikram_singh', email:'vikram@example.com', password:'pass1234' },
    ];
    const hashed = await Promise.all(users.map(async u => ({ ...u, password: await bcrypt.hash(u.password, 10) })));
    await User.insertMany(hashed);
    console.log('Seeded users.');

    const trains = [
      { name:'Rajdhani Express', number:'12951', from:'New Delhi', to:'Mumbai Central', id:'T001' },
      { name:'Duronto Express',  number:'12259', from:'Pune Jn',   to:'New Delhi',      id:'T004' },
    ];
    const classes = ['SL','3A','2A','1A'];
    const unames  = ['rahul_sharma','priya_patel','amit_kumar','sneha_gupta','vikram_singh'];
    const logs = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      for (let i = 0; i < 4; i++) {
        const u = unames[Math.floor(Math.random() * unames.length)];
        const t = trains[Math.floor(Math.random() * trains.length)];
        const c = classes[Math.floor(Math.random() * classes.length)];
        const p = Math.floor(Math.random() * 3) + 1;
        logs.push({ username:u, pnr:String(Math.floor(1e9+Math.random()*9e9)), trainName:t.name, trainNumber:t.number, from:t.from, to:t.to, date:dateStr, classCode:c, passengers:p, totalFare:p*(c==='1A'?4560:c==='2A'?2680:c==='3A'?1865:720), status:Math.random()>0.2?'CONFIRMED':'CANCELLED', loggedAt:date });
      }
    }
    await BookingLog.insertMany(logs);
    console.log('Seeded booking logs.');
  } catch (err) { console.error('Seed data error:', err); }
};

// ── Middleware ────────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
    next();
  });
};

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    if (username === 'admin') return res.status(400).json({ error: 'Username "admin" is reserved.' });
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(409).json({ error: `${exists.username === username ? 'Username' : 'Email'} already taken.` });
    const user = await User.create({ username, email, password: await bcrypt.hash(password, 10), role: 'user' });
    const token = jwt.sign({ username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid username or password.' });
    const token = jwt.sign({ username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Razorpay ──────────────────────────────────────────────────────────────────
// Step 1: Create order
app.post('/api/payment/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency,
               keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Step 2: Verify payment signature
app.post('/api/payment/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(body).digest('hex');
    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ error: 'Payment verification failed' });
    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Email ─────────────────────────────────────────────────────────────────────
app.post('/api/email/booking-confirmation', authMiddleware, async (req, res) => {
  try {
    const { to, ticket } = req.body;
    const preview = await sendEmail(to, `Booking Confirmed – PNR ${ticket.pnr}`, bookingConfirmHtml(ticket));
    res.json({ success: true, previewUrl: preview });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/email/cancellation', authMiddleware, async (req, res) => {
  try {
    const { to, ticket } = req.body;
    const preview = await sendEmail(to, `Cancellation Confirmed – PNR ${ticket.pnr}`, cancellationHtml(ticket));
    res.json({ success: true, previewUrl: preview });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Tickets ───────────────────────────────────────────────────────────────────
app.post('/api/tickets', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { pnr: req.body.pnr },
      { $setOnInsert: req.body },
      { upsert: true, new: true }
    );
    res.json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tickets/:username', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ username: req.params.username }).sort({ bookedAt: -1 });
    res.json(tickets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cancel ticket — works for both user (own) and admin (any)
app.patch('/api/tickets/:pnr/cancel', authMiddleware, async (req, res) => {
  try {
    const { pnr } = req.params;
    const ticket = await Ticket.findOne({ pnr });
    if (!ticket) return res.status(404).json({ error: `Ticket PNR ${pnr} not found.` });
    if (ticket.username !== req.user.username && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    if (ticket.status === 'CANCELLED') return res.status(400).json({ error: 'Already cancelled' });

    ticket.status = 'CANCELLED';
    await ticket.save();

    const train = await Train.findOne({ id: ticket.trainId });
    if (train) {
      const cls = train.classes.find(c => c.code === ticket.classCode);
      if (cls) { cls.available += ticket.passengers; cls.status = 'AVL'; }
      await train.save();
      broadcastSeatUpdate(ticket.trainId); // 🔴 live update to all users
    }
    await BookingLog.findOneAndUpdate({ pnr }, { status: 'CANCELLED' });

    // Send cancellation email automatically
    const emailTo = ticket.contactEmail || req.body.refundEmail;
    if (emailTo) {
      await sendEmail(emailTo, `Cancellation Confirmed – PNR ${pnr}`, cancellationHtml(ticket));
    }

    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Trains ────────────────────────────────────────────────────────────────────
app.get('/api/trains/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    let trains = await Train.find();
    if (from) trains = trains.filter(t => t.from.name.toLowerCase().includes(from.toLowerCase()) || t.from.code.toLowerCase().includes(from.toLowerCase()));
    if (to)   trains = trains.filter(t => t.to.name.toLowerCase().includes(to.toLowerCase())     || t.to.code.toLowerCase().includes(to.toLowerCase()));
    res.json(trains);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/trains/:id/availability', authMiddleware, async (req, res) => {
  try {
    const { classCode, count } = req.body;
    const train = await Train.findOne({ id: req.params.id });
    if (!train) return res.status(404).json({ error: 'Train not found' });
    const cls = train.classes.find(c => c.code === classCode);
    if (cls) { cls.available = Math.max(0, cls.available - count); if (cls.available === 0) cls.status = 'WL 1'; }
    await train.save();
    broadcastSeatUpdate(req.params.id); // 🔴 live update
    res.json({ success: true, train });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Booking logs ──────────────────────────────────────────────────────────────
app.post('/api/booking-logs', authMiddleware, async (req, res) => {
  try {
    const log = await BookingLog.create({ ...req.body, username: req.user.username });
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalUsers, totalTickets, cancelledTickets, logs, recentUsers, allTickets] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'CANCELLED' }),
      BookingLog.find().sort({ loggedAt: -1 }).limit(50),
      User.find({ role: { $ne: 'admin' } }, { password: 0 }).sort({ createdAt: -1 }).limit(20),
      Ticket.find().sort({ bookedAt: -1 }).limit(100),
    ]);
    const revenue = await Ticket.aggregate([{ $match: { status: 'CONFIRMED' } }, { $group: { _id: null, total: { $sum: '$totalFare' } } }]);
    const dailyStats = [];
    for (let d = 6; d >= 0; d--) {
      const start = new Date(); start.setDate(start.getDate() - d); start.setHours(0,0,0,0);
      const end   = new Date(); end.setDate(end.getDate() - d);     end.setHours(23,59,59,999);
      const count = await BookingLog.countDocuments({ loggedAt: { $gte: start, $lte: end } });
      dailyStats.push({ date: start.toISOString().split('T')[0], count });
    }
    res.json({ totalUsers, totalTickets, confirmedTickets: totalTickets - cancelledTickets, cancelledTickets, totalRevenue: revenue[0]?.total || 0, recentLogs: logs, recentUsers, dailyStats, allTickets });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin cancel any ticket + refund simulation
app.patch('/api/admin/tickets/:pnr/cancel', adminMiddleware, async (req, res) => {
  try {
    const { pnr } = req.params;
    const ticket = await Ticket.findOne({ pnr });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.status === 'CANCELLED') return res.status(400).json({ error: 'Already cancelled' });

    ticket.status = 'CANCELLED';
    await ticket.save();

    const train = await Train.findOne({ id: ticket.trainId });
    if (train) {
      const cls = train.classes.find(c => c.code === ticket.classCode);
      if (cls) { cls.available += ticket.passengers; cls.status = 'AVL'; }
      await train.save();
      broadcastSeatUpdate(ticket.trainId);
    }
    await BookingLog.findOneAndUpdate({ pnr }, { status: 'CANCELLED' });

    // Simulate refund + send email
    const refundId = `REFUND_${Date.now()}`;
    const emailTo  = ticket.contactEmail;
    if (emailTo) await sendEmail(emailTo, `Cancellation Confirmed – PNR ${pnr}`, cancellationHtml(ticket));

    res.json({ success: true, ticket, refundId, refundAmount: ticket.totalFare, message: `Refund of ₹${ticket.totalFare} initiated. Refund ID: ${refundId}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server + Socket.io running on port ${PORT}`));
