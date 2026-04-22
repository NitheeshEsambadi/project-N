const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    category: { type: String },
    designName: { type: String },
    expectedWeight: { type: Number },
    purity: { type: String },
    stones: [
        {
            stoneName: { type: String },
            stoneWeight: { type: Number }, // in carats or grams depending on business metric, use Number.
            stoneDetails: { type: String } // specific cut/clarity if needed
        }
    ],
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed'], 
        default: 'pending' 
    },
    grossWeight: { type: Number }, // Received weight
    netWeight: { type: Number },
    actualWastage: { type: Number },
    qualityCheck: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
    totalStoneWeight: { type: Number, default: 0 } // Simplified gross stone weight
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
