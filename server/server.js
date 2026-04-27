import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import Train from './models/Train.js';
import Ticket from './models/Ticket.js';

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your MongoDB connection string if using Atlas
const MONGO_URI = 'mongodb://127.0.0.1:27017/train-booking';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedTrains(); // Seed default data on startup
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Seed initial data if trains are empty
const seedTrains = async () => {
  try {
    const count = await Train.countDocuments();
    if (count === 0) {
      const defaultTrains = [
        {
          id: 'T001', number: '12951', name: 'Rajdhani Express', type: 'superfast',
          from: { code: 'NDLS', name: 'New Delhi' }, to: { code: 'MMCT', name: 'Mumbai Central' },
          departure: '16:35', arrival: '08:15', duration: '15h 40m', stops: 5, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          classes: [
            { code: '1A', name: 'First AC', price: 4560, available: 12, status: 'AVL' },
            { code: '2A', name: 'Second AC', price: 2680, available: 34, status: 'AVL' },
            { code: '3A', name: 'Third AC', price: 1865, available: 0, status: 'WL 14' },
            { code: 'SL', name: 'Sleeper', price: 720, available: 98, status: 'AVL' },
          ],
        },
        {
          id: 'T002', number: '12953', name: 'August Kranti Rajdhani', type: 'superfast',
          from: { code: 'NDLS', name: 'New Delhi' }, to: { code: 'BDTS', name: 'Mumbai Bandra' },
          departure: '17:40', arrival: '10:55', duration: '17h 15m', stops: 6, days: ['Mon', 'Thu'],
          classes: [
            { code: '1A', name: 'First AC', price: 4890, available: 4, status: 'AVL' },
            { code: '2A', name: 'Second AC', price: 2870, available: 21, status: 'AVL' },
            { code: '3A', name: 'Third AC', price: 1960, available: 63, status: 'AVL' },
          ],
        },
        {
          id: 'T003', number: '12903', name: 'Golden Temple Mail', type: 'express',
          from: { code: 'BCT', name: 'Mumbai Central' }, to: { code: 'ASR', name: 'Amritsar' },
          departure: '21:20', arrival: '21:35', duration: '24h 15m', stops: 12, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          classes: [
            { code: '2A', name: 'Second AC', price: 2210, available: 8, status: 'AVL' },
            { code: '3A', name: 'Third AC', price: 1520, available: 45, status: 'AVL' },
            { code: 'SL', name: 'Sleeper', price: 570, available: 0, status: 'WL 3' },
          ],
        },
        {
          id: 'T004', number: '12259', name: 'Duronto Express', type: 'superfast',
          from: { code: 'PUNE', name: 'Pune Jn' }, to: { code: 'NDLS', name: 'New Delhi' },
          departure: '11:05', arrival: '11:25', duration: '24h 20m', stops: 2, days: ['Tue', 'Thu', 'Sat'],
          classes: [
            { code: '1A', name: 'First AC', price: 5120, available: 6, status: 'AVL' },
            { code: '2A', name: 'Second AC', price: 2950, available: 18, status: 'AVL' },
            { code: '3A', name: 'Third AC', price: 1990, available: 72, status: 'AVL' },
          ],
        },
        {
          id: 'T005', number: '11077', name: 'Jhelum Express', type: 'express',
          from: { code: 'PUNE', name: 'Pune Jn' }, to: { code: 'ASR', name: 'Amritsar' },
          departure: '18:10', arrival: '23:55', duration: '29h 45m', stops: 18, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          classes: [
            { code: '3A', name: 'Third AC', price: 1680, available: 28, status: 'AVL' },
            { code: 'SL', name: 'Sleeper', price: 610, available: 0, status: 'WL 22' },
            { code: '2S', name: '2nd Sitting', price: 285, available: 200, status: 'AVL' },
          ],
        }
      ];
      await Train.insertMany(defaultTrains);
      console.log('Seeded default trains to MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

// --- API Routes ---

// GET /api/trains/search
app.get('/api/trains/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    if (from) query['from.code'] = new RegExp(from, 'i'); // IndexedDB implementation matched by code or name mostly
    if (to) query['to.code'] = new RegExp(to, 'i');
    
    let trains = await Train.find();
    
    if (from) {
      trains = trains.filter(t => t.from.name.toLowerCase().includes(from.toLowerCase()) || t.from.code.toLowerCase().includes(from.toLowerCase()));
    }
    if (to) {
      trains = trains.filter(t => t.to.name.toLowerCase().includes(to.toLowerCase()) || t.to.code.toLowerCase().includes(to.toLowerCase()));
    }
    
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets
app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/:username
app.get('/api/tickets/:username', async (req, res) => {
  try {
    const tickets = await Ticket.find({ username: req.params.username }).sort({ bookedAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trains/:id/availability
app.put('/api/trains/:id/availability', async (req, res) => {
  try {
    const { classCode, count } = req.body;
    const train = await Train.findOne({ id: req.params.id });
    if (!train) return res.status(404).json({ error: 'Train not found' });
    
    const cls = train.classes.find(c => c.code === classCode);
    if (cls) {
      cls.available = Math.max(0, cls.available - count);
      if (cls.available === 0) cls.status = 'WL 1'; // Simulated waitlist
    }
    await train.save();
    res.json({ success: true, train });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
