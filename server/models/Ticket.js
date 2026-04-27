import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  pnr:              { type: String, required: true, unique: true },
  username:         { type: String, required: true },
  trainId:          String,
  trainNumber:      String,
  trainName:        String,
  from:             String,
  to:               String,
  date:             String,
  classCode:        String,
  passengers:       Number,
  passengerDetails: [{ name: String, age: String, gender: String, berthPreference: String }],
  contactEmail:     String,
  paymentId:        String,
  totalFare:        Number,
  status:           String,
  bookedAt:         { type: Date, default: Date.now }
});

export default mongoose.model('Ticket', ticketSchema);
