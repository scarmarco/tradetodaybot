const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  price: { type: Number },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  telegram: { type: String, unique: true, required: true, index: true },
  refs: [String],
  trades: [tradeSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
