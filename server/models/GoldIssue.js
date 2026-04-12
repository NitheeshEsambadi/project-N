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
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('GoldIssue', goldIssueSchema);
