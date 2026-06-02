const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Worker = require('../models/Worker');

const Company = require('../models/Company');

const createProduct = async (req, res) => {
    try {
        const { category, workerId, quantity, ...rest } = req.body;
        const qty = parseInt(quantity) || 1;
        const products = [];
        
        const worker = await Worker.findById(workerId);
        const workerCode = worker?.workerID || 'W000';
        
        let company = await Company.findOne({ isGlobal: true });
        let catCode = 'XX';
        if (company && company.categories) {
            const catObj = company.categories.find(c => c.name === category);
            if (catObj) catCode = catObj.code;
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        let count = await Product.countDocuments({ createdAt: { $gte: startOfDay } });
        const dateStr = startOfDay.toLocaleDateString('en-GB').replace(/\//g, '');

        for (let i = 0; i < qty; i++) {
            const serial = String(count + 1).padStart(3, '0');
            const finalProductId = `${workerCode}-${catCode}-${dateStr}-${serial}`;
            
            const product = new Product({
                ...rest,
                category,
                workerId,
                productId: finalProductId
            });
            
            const saved = await product.save();
            products.push(saved);
            count++;
        }
        
        res.status(201).json(qty === 1 ? products[0] : products);
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
            labourAmount = netWeight * (worker.baseRate || 0);
        } else if (worker.labourRateType === 'perPiece' || worker.labourRateType === 'fixed') {
            labourAmount = (worker.baseRate || 0);
        } else {
            labourAmount = 0; // Default if no rate type is set
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
    const { workerId, status } = req.query;
    const filter = {};
    if (workerId) filter.workerId = workerId;
    if (status) filter.status = status;
    const products = await Product.find(filter).populate('workerId', 'name workerID').sort({ createdAt: -1 });
    res.json(products);
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createProduct, receiveProduct, getProducts, updateProduct };
