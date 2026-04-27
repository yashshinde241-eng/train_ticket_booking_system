import { openDB } from 'idb';

const DB_NAME = 'train-booking-db';
const DB_VERSION = 1;

// â”€â”€â”€ Seed Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SEED_TRAINS = [
  {
    id: 'T001',
    number: '12951',
    name: 'Rajdhani Express',
    type: 'superfast',
    from: { code: 'NDLS', name: 'New Delhi' },
    to: { code: 'MMCT', name: 'Mumbai Central' },
    departure: '16:35',
    arrival: '08:15',
    duration: '15h 40m',
    stops: 5,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classes: [
      { code: '1A', name: 'First AC',    price: 4560, available: 12, status: 'AVL' },
      { code: '2A', name: 'Second AC',   price: 2680, available: 34, status: 'AVL' },
      { code: '3A', name: 'Third AC',    price: 1865, available: 0,  status: 'WL 14' },
      { code: 'SL', name: 'Sleeper',     price: 720,  available: 98, status: 'AVL' },
    ],
  },
  {
    id: 'T002',
    number: '12953',
    name: 'August Kranti Rajdhani',
    type: 'superfast',
    from: { code: 'NDLS', name: 'New Delhi' },
    to: { code: 'BDTS', name: 'Mumbai Bandra' },
    departure: '17:40',
    arrival: '10:55',
    duration: '17h 15m',
    stops: 6,
    days: ['Mon', 'Thu'],
    classes: [
      { code: '1A', name: 'First AC',  price: 4890, available: 4,  status: 'AVL' },
      { code: '2A', name: 'Second AC', price: 2870, available: 21, status: 'AVL' },
      { code: '3A', name: 'Third AC',  price: 1960, available: 63, status: 'AVL' },
    ],
  },
  {
    id: 'T003',
    number: '12903',
    name: 'Golden Temple Mail',
    type: 'express',
    from: { code: 'BCT', name: 'Mumbai Central' },
    to: { code: 'ASR', name: 'Amritsar' },
    departure: '21:20',
    arrival: '21:35',
    duration: '24h 15m',
    stops: 12,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classes: [
      { code: '2A', name: 'Second AC', price: 2210, available: 8,  status: 'AVL' },
      { code: '3A', name: 'Third AC',  price: 1520, available: 45, status: 'AVL' },
      { code: 'SL', name: 'Sleeper',   price: 570,  available: 0,  status: 'WL 3' },
    ],
  },
  {
    id: 'T004',
    number: '12259',
    name: 'Duronto Express',
    type: 'superfast',
    from: { code: 'PUNE', name: 'Pune Jn' },
    to: { code: 'NDLS', name: 'New Delhi' },
    departure: '11:05',
    arrival: '11:25',
    duration: '24h 20m',
    stops: 2,
    days: ['Tue', 'Thu', 'Sat'],
    classes: [
      { code: '1A', name: 'First AC',  price: 5120, available: 6,  status: 'AVL' },
      { code: '2A', name: 'Second AC', price: 2950, available: 18, status: 'AVL' },
      { code: '3A', name: 'Third AC',  price: 1990, available: 72, status: 'AVL' },
    ],
  },
  {
    id: 'T005',
    number: '11077',
    name: 'Jhelum Express',
    type: 'express',
    from: { code: 'PUNE', name: 'Pune Jn' },
    to: { code: 'ASR', name: 'Amritsar' },
    departure: '18:10',
    arrival: '23:55',
    duration: '29h 45m',
    stops: 18,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classes: [
      { code: '3A', name: 'Third AC',    price: 1680, available: 28,  status: 'AVL' },
      { code: 'SL', name: 'Sleeper',     price: 610,  available: 0,   status: 'WL 22' },
      { code: '2S', name: '2nd Sitting', price: 285,  available: 200, status: 'AVL' },
    ],
  },
];

// â”€â”€â”€ Open / Upgrade DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // trains store
        if (!db.objectStoreNames.contains('trains')) {
          const trainStore = db.createObjectStore('trains', { keyPath: 'id' });
          trainStore.createIndex('number', 'number', { unique: true });
        }
        // tickets store
        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'pnr' });
          ticketStore.createIndex('username', 'username', { unique: false });
          ticketStore.createIndex('trainId',  'trainId',  { unique: false });
          ticketStore.createIndex('bookedAt', 'bookedAt', { unique: false });
        }
        // users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'username' });
        }
      },
    });
  }
  return dbPromise;
}

// â”€â”€â”€ Init & Seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function initDB() {
  const db = await getDB();
  // Seed trains only if the store is empty
  const count = await db.count('trains');
  if (count === 0) {
    const tx = db.transaction('trains', 'readwrite');
    await Promise.all([
      ...SEED_TRAINS.map(t => tx.store.put(t)),
      tx.done,
    ]);
    console.log('[DB] Seeded', SEED_TRAINS.length, 'trains into IndexedDB');
  }
  return db;
}

// â”€â”€â”€ TRAIN helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAllTrains() {
  const db = await getDB();
  return db.getAll('trains');
}

export async function getTrainById(id) {
  const db = await getDB();
  return db.get('trains', id);
}

/**
 * Search trains â€” returns all trains (seats reflect live DB availability).
 * The from/to params are injected into each result for display purposes.
 */
export async function searchTrainsDB(from, to) {
  const trains = await getAllTrains();
  return trains.map(t => ({
    ...t,
    from: { ...t.from, name: from },
    to:   { ...t.to,   name: to   },
  }));
}

/**
 * Decrement seat availability for a class after a booking.
 * @param {string} trainId
 * @param {string} classCode  e.g. '2A'
 * @param {number} count      number of passengers booked
 */
export async function updateTrainAvailability(trainId, classCode, count) {
  const db = await getDB();
  const tx = db.transaction('trains', 'readwrite');
  const train = await tx.store.get(trainId);
  if (!train) { await tx.done; return; }

  train.classes = train.classes.map(cls => {
    if (cls.code !== classCode) return cls;
    const newAvail = Math.max(0, cls.available - count);
    return {
      ...cls,
      available: newAvail,
      status: newAvail > 0 ? 'AVL' : (cls.status.startsWith('WL') ? cls.status : 'WL 1'),
    };
  });

  await tx.store.put(train);
  await tx.done;
}

// â”€â”€â”€ TICKET helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/**
 * Save a confirmed booking ticket to the database.
 * @param {object} ticket
 */
export async function saveTicket(ticket) {
  const db = await getDB();
  await db.put('tickets', { ...ticket, bookedAt: new Date().toISOString() });
}

/**
 * Get all tickets for a specific user, newest first.
 */
export async function getTicketsByUser(username) {
  const db = await getDB();
  const all = await db.getAllFromIndex('tickets', 'username', username);
  return all.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
}

/**
 * Lookup a ticket by PNR.
 */
export async function getTicketByPNR(pnr) {
  const db = await getDB();
  return db.get('tickets', pnr);
}

/**
 * Get ALL tickets (admin view).
 */
export async function getAllTickets() {
  const db = await getDB();
  const all = await db.getAll('tickets');
  return all.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
}

// â”€â”€â”€ USER helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function saveUser(username, passwordHash) {
  const db = await getDB();
  await db.put('users', { username, passwordHash, createdAt: new Date().toISOString() });
}

export async function getUser(username) {
  const db = await getDB();
  return db.get('users', username);
}
