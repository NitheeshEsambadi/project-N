const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/mgmt/audit
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .populate('user', 'username role')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

module.exports = { getAuditLogs };
