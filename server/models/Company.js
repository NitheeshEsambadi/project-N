const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    isGlobal: { type: Boolean, default: true, unique: true }, // Singleton pattern
    categories: [
        {
            name: { type: String, required: true },
            code: { type: String, required: true },
            defaultLabourRate: { type: Number, default: 0 }
        }
    ],
    stones: [
        {
            stoneName: { type: String, required: true },
            stoneType: { type: String },
            pricePerUnit: { type: Number, default: 0 },
            unit: { type: String, enum: ['carat', 'gram', 'piece'], default: 'carat' }
        }
    ],
    purityStandards: [
        {
            label: { type: String, required: true }, // e.g. "91.6 (22k)"
            value: { type: Number, required: true }  // e.g. 91.6
        }
    ],
    qrFormat: { 
        type: String, 
        enum: ['qr', 'qr_name', 'qr_name_wt', 'qr_name_wt_stone', 'qr_name_wt_stonewt_details'], 
        default: 'qr' 
    },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    taxId: { type: String, default: '' }, // GST or VAT
    currency: { type: String, default: '₹' }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
