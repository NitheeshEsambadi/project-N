const mongoose = require('mongoose');

const workerReceiptSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    items: [
        {
            barcode: { type: String },
            product: { type: String, required: true },
            grossWeight: { type: Number, required: true },
            stoneWeight: { type: Number, default: 0 },
            netWeight: { type: Number, required: true },
            purity: { type: String },
            huid: { type: String },
            description: { type: String }
        }
    ],
    totalWeight: { type: Number, required: true },
    totalStoneWeight: { type: Number, default: 0 },
    totalItems: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('WorkerReceipt', workerReceiptSchema);
