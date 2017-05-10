const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  price: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
