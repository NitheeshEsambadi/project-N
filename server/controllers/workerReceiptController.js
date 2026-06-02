const WorkerReceipt = require('../models/WorkerReceipt');
const Product = require('../models/Product');
const Worker = require('../models/Worker');
const Transaction = require('../models/Transaction');

const parseStones = (description) => {
    const stoneMatch = (description || '').match(/^\(([^)]+)\)/);
    if (!stoneMatch) return [];
    return stoneMatch[1].split(',').map(pair => {
        const parts = pair.split(':');
        return {
            stoneName: parts[0]?.trim() || '',
            stoneWeight: parseFloat(parts[1]) || 0
        };
    });
};

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

        // Retrieve worker to access labor rate settings
        const worker = await Worker.findById(workerId);

        // For each item in the receipt, create a completed Product in inventory & log a worker ledger audit
        if (items && items.length > 0) {
            for (const item of items) {
                const parsedStones = parseStones(item.description);
                
                const product = new Product({
                    productId: item.barcode || `PR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    category: item.product,
                    designName: item.product,
                    grossWeight: item.grossWeight,
                    netWeight: item.netWeight,
                    totalStoneWeight: item.stoneWeight,
                    purity: item.purity,
                    purityType: 'Percentage',
                    workerId: workerId,
                    status: 'completed',
                    stones: parsedStones,
                    huid: item.huid,
                    notes: item.description
                });
                
                const savedProduct = await product.save();

                // Calculate Labour Earning
                let labourAmount = 0;
                if (worker) {
                    if (worker.labourRateType === 'perGram') {
                        labourAmount = item.netWeight * (worker.baseRate || 0);
                    } else if (worker.labourRateType === 'perPiece' || worker.labourRateType === 'fixed') {
                        labourAmount = (worker.baseRate || 0);
                    }
                }

                // Record Earning & Gold Return Audit Transaction
                await Transaction.create({
                    workerId: workerId,
                    type: 'earning',
                    amount: labourAmount,
                    goldAmount: -item.netWeight, // Negative goldAmount to credit back/reduce the gold issued to worker
                    referenceId: savedProduct._id,
                    notes: `Finished product: ${item.product} (Barcode: ${item.barcode}) - Net Wt: ${item.netWeight}g, Labour: ${labourAmount}`
                });
            }
        }
        
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
