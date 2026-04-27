import mongoose from 'mongoose';

const bookingLogSchema = new mongoose.Schema({
  username:    { type: String, required: true },
  pnr:         { type: String, required: true },
  trainName:   String,
  trainNumber: String,
  from:        String,
  to:          String,
  date:        String,
  classCode:   String,
  passengers:  Number,
  totalFare:   Number,
  status:      String,
  loggedAt:    { type: Date, default: Date.now }
});

export default mongoose.model('BookingLog', bookingLogSchema);
