const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    type: { 
        type: String, 
        enum: ['earning', 'payment'], 
        required: true 
    }, // Earning (from work) or Payment (to worker)
    amount: { type: Number, default: 0 }, // Cash amount
    goldAmount: { type: Number, default: 0 }, // Gold weight in grams (positive for credit/earning, negative for payment/debit)
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String }, // Cash, Bank, Metal, etc.
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Link to Product if earning
    balance: { type: Number }, // Balance after this transaction
    goldBalance: { type: Number }, // Gold balance after this transaction
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
