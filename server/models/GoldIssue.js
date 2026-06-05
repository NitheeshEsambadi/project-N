const mongoose = require('mongoose');

const goldIssueSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    weight: { type: Number, required: true }, // in grams
    purity: { type: String, default: '22k' },
    expectedWastage: { type: Number, default: 0 }, // percentage
    deliveryDate: { type: Date },
    status: { 
        type: String, 
        enum: ['pending', 'completed'], 
        default: 'pending' 
    },
    stones: [
        {
            stoneName: { type: String },
            stoneWeight: { type: Number }
        }
    ],
    notes: { type: String },
    totalStoneWeight: { type: Number, default: 0 }, // Simplified gross stone weight
    itemName: { type: String, default: '' },
    category: { type: String, default: '' },
    cashIssued: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('GoldIssue', goldIssueSchema);
