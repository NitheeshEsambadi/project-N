const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    metalRateUsed: { type: Number, required: true },
    makingCharges: { type: Number, default: 0 },
    stoneCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Multiple'], default: 'Cash' },
    status: { type: String, enum: ['Completed', 'Cancelled'], default: 'Completed' },
    soldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
