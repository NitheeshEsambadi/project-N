const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    category: { type: String },
    designName: { type: String },
    expectedWeight: { type: Number },
    stoneDetails: { type: String },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed'], 
        default: 'pending' 
    },
    grossWeight: { type: Number }, // Received weight
    netWeight: { type: Number },
    actualWastage: { type: Number },
    qualityCheck: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
