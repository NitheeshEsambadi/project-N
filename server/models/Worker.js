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

workerSchema.pre('save', async function(next) {
    if (!this.workerID) {
        const count = await mongoose.model('Worker').countDocuments();
        this.workerID = `W${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Worker', workerSchema);
