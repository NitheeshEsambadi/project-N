const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    isGlobal: { type: Boolean, default: true, unique: true }, // Singleton pattern
    categories: [
        {
            name: { type: String, required: true },
            code: { type: String, required: true },
            defaultLabourRate: { type: Number, default: 0 },
            status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    stones: [
        {
            stoneName: { type: String, required: true },
            code: { type: String, default: '' },
            stoneType: { type: String, default: 'Precious' },
            pricePerUnit: { type: Number, default: 0 },
            unit: { type: String, enum: ['carat', 'gram', 'piece'], default: 'carat' },
            pieceWeight: { type: Number, default: 0 },
            status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
            createdAt: { type: Date, default: Date.now }
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
    name: { type: String, default: 'PRO PORTAL' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    taxId: { type: String, default: '' }, // GST or VAT
    currency: { type: String, default: '₹' },
    printSettings: {
        showHeaderLogo: { type: Boolean, default: true },
        showHeaderGSTIN: { type: Boolean, default: true },
        showHeaderAddress: { type: Boolean, default: true },
        showHeaderContact: { type: Boolean, default: true },
        showHallmarkLogo: { type: Boolean, default: true },
        showBISLogo: { type: Boolean, default: true },
        showItemBarcode: { type: Boolean, default: true },
        showItemHUID: { type: Boolean, default: true },
        showItemDescription: { type: Boolean, default: true },
        showItemStoneDetails: { type: Boolean, default: true },
        groupStoneDetails: { type: Boolean, default: true },
        showItemProductImage: { type: Boolean, default: true },
        showAmountGoldRate: { type: Boolean, default: true },
        showAmountStoneCharges: { type: Boolean, default: true },
        showAmountMakingCharges: { type: Boolean, default: true },
        showAmountDiscount: { type: Boolean, default: true },
        showAmountGST: { type: Boolean, default: true },
        customerTemplate: { type: String, default: 'classic' },
        workerTemplate: { type: String, default: 'corporate' },
        watermark: { type: String, default: 'none' },
        multiCopy: {
            customerCopy: { type: Boolean, default: true },
            officeCopy: { type: Boolean, default: true },
            workerCopy: { type: Boolean, default: false }
        },
        defaultPageSize: { type: String, default: 'a4' },
        qrOption: { type: String, default: 'invoice' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
