const Transaction = require('../models/Transaction');

const getTransactions = async (req, res) => {
    const { workerId } = req.query;
    const filter = workerId ? { workerId } : {};
    const transactions = await Transaction.find(filter).populate('workerId', 'name').sort({ createdAt: -1 });
    res.json(transactions);
};

const recordTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.create(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getTransactions, recordTransaction };
