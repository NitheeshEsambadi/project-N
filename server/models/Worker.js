const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    workerID: { type: String, unique: true },
    name: { type: String, required: true },
    contact: { type: String },
    specialization: { type: String }, // e.g., Necklace, Rings, Polishing
    labourRateType: { 
        type: String, 
        enum: ['perGram', 'perPiece', 'fixed'], 
        required: true 
    },
    baseRate: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Link if role is 'worker'
}, { timestamps: true });

workerSchema.pre('save', async function() {
    if (!this.workerID) {
        // Find the highest existing workerID and increment
        const lastWorker = await mongoose.model('Worker')
            .findOne({ workerID: { $regex: /^W\d+$/ } })
            .sort({ workerID: -1 })
            .lean();
        
        let nextNum = 1;
        if (lastWorker && lastWorker.workerID) {
            const num = parseInt(lastWorker.workerID.replace('W', ''), 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
        
        this.workerID = `W${nextNum.toString().padStart(3, '0')}`;
    }
});

module.exports = mongoose.model('Worker', workerSchema);
