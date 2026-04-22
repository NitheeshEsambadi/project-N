const mongoose = require('mongoose');
const GoldIssue = require('../models/GoldIssue');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Worker = require('../models/Worker');

// @desc    Get dashboard summary stats
// @route   GET /api/stats/dashboard
// @access  Private (Admin/Accountant)
exports.getDashboardStats = async (req, res) => {
    try {
        const totalGoldIssued = await GoldIssue.aggregate([
            { $group: { _id: null, total: { $sum: '$weight' } } }
        ]);

        const completedProducts = await Product.countDocuments({ status: 'completed' });
        const pendingProducts = await Product.countDocuments({ status: { $ne: 'completed' } });

        const financialStats = await Transaction.aggregate([
            { $group: { 
                _id: '$type', 
                total: { $sum: '$amount' } 
            } }
        ]);

        const totalEarnings = financialStats.find(s => s._id === 'earning')?.total || 0;
        const totalPayments = financialStats.find(s => s._id === 'payment')?.total || 0;

        res.json({
            goldIssued: totalGoldIssued[0]?.total || 0,
            completedProducts,
            pendingProducts,
            totalEarnings,
            totalPayments,
            netBalance: totalEarnings - totalPayments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get stats for a specific worker
// @route   GET /api/stats/worker/:id
// @access  Private
exports.getWorkerStats = async (req, res) => {
    try {
        const workerId = new mongoose.Types.ObjectId(req.params.id);

        const totalGoldIssued = await GoldIssue.aggregate([
            { $match: { workerId } },
            { $group: { _id: null, total: { $sum: '$weight' } } }
        ]);

        const goldReturnedStats = await GoldIssue.aggregate([
            { $match: { workerId, status: { $in: ['completed', 'returned'] } } },
            { $group: { _id: null, total: { $sum: '$weight' } } }
        ]);

        const productStats = await Product.countDocuments({ workerId, status: 'completed' });

        const financeStats = await Transaction.aggregate([
            { $match: { workerId } },
            { $group: { 
                _id: '$type', 
                total: { $sum: '$amount' } 
            } }
        ]);

        res.json({
            goldIssued: totalGoldIssued[0]?.total || 0,
            goldReturned: goldReturnedStats[0]?.total || 0,
            completedProducts: productStats,
            totalEarnings: financeStats.find(s => s._id === 'earning')?.total || 0,
            totalPayments: financeStats.find(s => s._id === 'payment')?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
