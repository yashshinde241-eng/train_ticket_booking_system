import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  code: String,
  name: String,
  price: Number,
  available: Number,
  status: String
});

const trainSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  number: String,
  name: String,
  type: String,
  from: { code: String, name: String },
  to: { code: String, name: String },
  departure: String,
  arrival: String,
  duration: String,
  stops: Number,
  days: [String],
  classes: [classSchema]
});

export default mongoose.model('Train', trainSchema);
