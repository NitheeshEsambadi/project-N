const mongoose = require('mongoose');

const goldIssueSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    weight: { type: Number, required: true }, // in grams
    purity: { type: String, default: '22k' },
    expectedWastage: { type: Number, default: 0 }, // percentage
    deliveryDate: { type: Date },
    status: { 
        type: String, 
        enum: ['issued', 'completed', 'returned'], 
        default: 'issued' 
    },
    stones: [
        {
            stoneName: { type: String },
            stoneWeight: { type: Number }
        }
    ],
    notes: { type: String },
    totalStoneWeight: { type: Number, default: 0 } // Simplified gross stone weight
}, { timestamps: true });

module.exports = mongoose.model('GoldIssue', goldIssueSchema);
