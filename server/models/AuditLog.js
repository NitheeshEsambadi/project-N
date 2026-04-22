const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: { type: String, required: true }, // e.g., "DELETE_PRODUCT", "UPDATE_COMPANY"
    targetModel: { type: String },
    targetId: { type: String },
    details: { type: String }, // JSON string or text summary
    ipAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
