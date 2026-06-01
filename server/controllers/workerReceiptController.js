const WorkerReceipt = require('../models/WorkerReceipt');

const createWorkerReceipt = async (req, res) => {
    try {
        const { date, workerId, items, totalWeight, totalStoneWeight, totalItems } = req.body;
        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const count = await WorkerReceipt.countDocuments({ createdAt: { $gte: startOfDay } });
        const dateStr = startOfDay.toLocaleDateString('en-GB').replace(/\//g, '');
        const serial = String(count + 1).padStart(4, '0');
        const receiptNumber = `WR-${dateStr}-${serial}`;

        const newReceipt = new WorkerReceipt({
            receiptNumber,
            date: date ? new Date(date) : new Date(),
            workerId,
            items,
            totalWeight,
            totalStoneWeight,
            totalItems
        });

        const saved = await newReceipt.save();
        
        const populated = await WorkerReceipt.findById(saved._id).populate('workerId', 'name workerID');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getWorkerReceipts = async (req, res) => {
    try {
        const receipts = await WorkerReceipt.find()
            .populate('workerId', 'name workerID')
            .sort({ createdAt: -1 });
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createWorkerReceipt, getWorkerReceipts };
