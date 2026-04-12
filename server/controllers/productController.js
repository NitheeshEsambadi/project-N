const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Worker = require('../models/Worker');

const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const receiveProduct = async (req, res) => {
    try {
        const { grossWeight, netWeight, actualWastage, qualityCheck } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const worker = await Worker.findById(product.workerId);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        product.grossWeight = grossWeight;
        product.netWeight = netWeight;
        product.actualWastage = actualWastage;
        product.qualityCheck = qualityCheck;
        product.status = 'completed';

        const updated = await product.save();

        // Calculate Labour Earning
        let labourAmount = 0;
        if (worker.labourRateType === 'perGram') {
            labourAmount = netWeight * worker.baseRate;
        } else {
            labourAmount = worker.baseRate; // perPiece or fixed
        }

        // Create Earning Transaction
        await Transaction.create({
            workerId: worker._id,
            type: 'earning',
            amount: labourAmount,
            referenceId: updated._id,
            notes: `Labour for ${product.category} - ${product.designName} (ID: ${product.productId})`
        });

        res.json({ product: updated, labourAmount });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getProducts = async (req, res) => {
    const { workerId } = req.query;
    const filter = workerId ? { workerId } : {};
    const products = await Product.find(filter).populate('workerId', 'name workerID').sort({ createdAt: -1 });
    res.json(products);
};

module.exports = { createProduct, receiveProduct, getProducts };
