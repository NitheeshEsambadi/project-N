const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    workerID: { type: String, unique: true },
    name: { type: String, required: true },
    contact: { type: String },
    specialization: { type: String }, // e.g., Necklace, Rings, Polishing
    identityNumber: { type: String }, // Aadhar, PAN, etc.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link if role is 'worker'
    // Legacy fields marked as optional to prevent validation errors during transition
    labourRateType: { type: String, required: false },
    baseRate: { type: Number, required: false }
}, { timestamps: true });

// Auto-generate numeric workerID (e.g., 001, 002)
workerSchema.pre('save', async function(next) {
    if (!this.workerID) {
        try {
            const lastWorker = await mongoose.model('Worker')
                .findOne()
                .sort({ createdAt: -1 })
                .lean();
            
            let nextNum = 1;
            if (lastWorker && lastWorker.workerID) {
                const num = parseInt(lastWorker.workerID.replace(/\D/g, ''), 10);
                if (!isNaN(num)) nextNum = num + 1;
            }
            
            this.workerID = nextNum.toString().padStart(3, '0');
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Worker', workerSchema);
