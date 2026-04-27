import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, default: 'user', enum: ['user', 'admin'] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
