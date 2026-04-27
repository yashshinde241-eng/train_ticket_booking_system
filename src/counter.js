// Utility counter and helper functions

export function generatePNR() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '0123456789';
  let pnr = '';
  for (let i = 0; i < 3; i++) pnr += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 7; i++) pnr += nums[Math.floor(Math.random() * nums.length)];
  return pnr;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long' });
}

export function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export const TRAINS = [
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
      { code: '1A', name: 'First AC', price: 4560, available: 12, status: 'AVL' },
      { code: '2A', name: 'Second AC', price: 2680, available: 34, status: 'AVL' },
      { code: '3A', name: 'Third AC', price: 1865, available: 0, status: 'WL 14' },
      { code: 'SL', name: 'Sleeper', price: 720, available: 98, status: 'AVL' },
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
      { code: '1A', name: 'First AC', price: 4890, available: 4, status: 'AVL' },
      { code: '2A', name: 'Second AC', price: 2870, available: 21, status: 'AVL' },
      { code: '3A', name: 'Third AC', price: 1960, available: 63, status: 'AVL' },
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
      { code: '2A', name: 'Second AC', price: 2210, available: 8, status: 'AVL' },
      { code: '3A', name: 'Third AC', price: 1520, available: 45, status: 'AVL' },
      { code: 'SL', name: 'Sleeper', price: 570, available: 0, status: 'WL 3' },
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
      { code: '1A', name: 'First AC', price: 5120, available: 6, status: 'AVL' },
      { code: '2A', name: 'Second AC', price: 2950, available: 18, status: 'AVL' },
      { code: '3A', name: 'Third AC', price: 1990, available: 72, status: 'AVL' },
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
      { code: '3A', name: 'Third AC', price: 1680, available: 28, status: 'AVL' },
      { code: 'SL', name: 'Sleeper', price: 610, available: 0, status: 'WL 22' },
      { code: '2S', name: '2nd Sitting', price: 285, available: 200, status: 'AVL' },
    ],
  },
];

export function searchTrains(from, to) {
  if (!from || !to) return [];
  // Simple mock: return all trains as if they match
  return TRAINS.map(t => ({
    ...t,
    from: { ...t.from, name: from },
    to: { ...t.to, name: to },
  }));
}

export const CLASS_INFO = {
  '1A': { name: 'First AC', desc: 'Air-conditioned, private cabins with 2 berths', icon: '' },
  '2A': { name: 'Second AC', desc: 'Air-conditioned, 4-berth open bays with curtains', icon: '' },
  '3A': { name: 'Third AC', desc: 'Air-conditioned, 6-berth open bays', icon: '' },
  'SL': { name: 'Sleeper', desc: 'Non-AC, 6-berth compartments, most economical', icon: '' },
  '2S': { name: '2nd Sitting', desc: 'Non-AC day journey seating', icon: '' },
};

export const BERTH_OPTIONS = ['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', 'No Preference'];