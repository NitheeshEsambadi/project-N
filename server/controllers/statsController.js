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

        // Gold Distribution Details
        const allWorkers = await Worker.find({}, 'name workerID');
        const goldDistribution = await Promise.all(allWorkers.map(async (w) => {
            const workerId = w._id;
            const issued = await GoldIssue.aggregate([
                { $match: { workerId } },
                { $group: { _id: null, total: { $sum: '$weight' } } }
            ]);
            const returned = await GoldIssue.aggregate([
                { $match: { workerId, status: { $in: ['completed', 'returned'] } } },
                { $group: { _id: null, total: { $sum: '$weight' } } }
            ]);
            const adjustmentStats = await Transaction.aggregate([
                { $match: { workerId } },
                { $group: { _id: null, total: { $sum: '$goldAmount' } } }
            ]);

            const productsOfWorker = await Product.find({ workerId });
            let productGoldIssued = 0;
            let productGoldReturned = 0;
            productsOfWorker.forEach(p => {
                productGoldIssued += parseFloat(p.expectedWeight) || 0;
                if (p.issuances && p.issuances.length > 0) {
                    p.issuances.forEach(iss => {
                        productGoldIssued += parseFloat(iss.weight) || 0;
                    });
                }
                if (p.status === 'completed') {
                    productGoldReturned += parseFloat(p.grossWeight) || 0;
                }
            });

            const bal = (issued[0]?.total || 0) + productGoldIssued - (returned[0]?.total || 0) - productGoldReturned + (adjustmentStats[0]?.total || 0);
            return {
                name: w.name,
                workerID: w.workerID,
                goldBalance: parseFloat(bal.toFixed(3))
            };
        }));

        res.json({
            goldIssued: totalGoldIssued[0]?.total || 0,
            completedProducts,
            pendingProducts,
            totalEarnings,
            totalPayments,
            netBalance: totalEarnings - totalPayments,
            goldDistribution: goldDistribution.filter(d => d.goldBalance !== 0)
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

        const productsOfWorker = await Product.find({ workerId });
        let productGoldIssued = 0;
        let productGoldReturned = 0;
        productsOfWorker.forEach(p => {
            productGoldIssued += parseFloat(p.expectedWeight) || 0;
            if (p.issuances && p.issuances.length > 0) {
                p.issuances.forEach(iss => {
                    productGoldIssued += parseFloat(iss.weight) || 0;
                });
            }
            if (p.status === 'completed') {
                productGoldReturned += parseFloat(p.grossWeight) || 0;
            }
        });

        const financeStats = await Transaction.aggregate([
            { $match: { workerId } },
            { $group: { 
                _id: '$type', 
                total: { $sum: '$amount' },
                goldTotal: { $sum: '$goldAmount' }
            } }
        ]);

        const goldAdjustment = financeStats.reduce((acc, curr) => acc + (curr.goldTotal || 0), 0);

        res.json({
            goldIssued: (totalGoldIssued[0]?.total || 0) + productGoldIssued,
            goldReturned: (goldReturnedStats[0]?.total || 0) + productGoldReturned,
            goldAdjustment,
            completedProducts: productStats,
            totalEarnings: financeStats.find(s => s._id === 'earning')?.total || 0,
            totalPayments: financeStats.find(s => s._id === 'payment')?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
