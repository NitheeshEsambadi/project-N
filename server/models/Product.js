const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    category: { type: String },
    designName: { type: String },
    expectedWeight: { type: Number }, // This represents Issued Gold (held as expectedWeight in DB to prevent breakage)
    expectedFinishedWeight: { type: Number }, // This represents the new expected weight (optional)
    purity: { type: String },
    purityType: { type: String, enum: ['Carat', 'Percentage'], default: 'Carat' },
    pureWeight: { type: Number },
    issuanceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    stones: [
        {
            stoneName: { type: String },
            stoneWeight: { type: Number }, // in carats or grams depending on business metric, use Number.
            stoneDetails: { type: String }, // specific cut/clarity if needed
            pieces: { type: Number, default: 1 }
        }
    ],
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    status: { 
        type: String, 
        enum: ['pending', 'completed'], 
        default: 'pending' 
    },
    grossWeight: { type: Number }, // Received weight
    netWeight: { type: Number },
    actualWastage: { type: Number },
    qualityCheck: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
    totalStoneWeight: { type: Number, default: 0 }, // Simplified gross stone weight
    notes: { type: String }, // Design notes or instructions
    huid: { type: String },
    draftList: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Stores the UI drafted items
    issuances: [
        {
            weight: { type: Number },
            purity: { type: String },
            stones: [
                {
                    stoneName: { type: String },
                    stoneWeight: { type: Number },
                    stoneDetails: { type: String },
                    pieces: { type: Number, default: 1 }
                }
            ],
            totalStoneWeight: { type: Number, default: 0 },
            issuanceDate: { type: Date, default: Date.now },
            notes: { type: String },
            cashIssuance: { type: Number, default: 0 }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
