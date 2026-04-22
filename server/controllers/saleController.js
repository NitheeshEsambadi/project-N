const Sale = require('../models/Sale');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// @desc    Record a new sale
// @route   POST /api/mgmt/sales
const recordSale = async (req, res) => {
    try {
        const { productId, customerName, customerPhone, metalRateUsed, makingCharges, stoneCharges, discount, totalPrice, paymentMethod } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.status === 'sold') return res.status(400).json({ message: 'Product already sold' });

        // Calculate total if not provided (safety)
        // const calculatedTotal = (product.netWeight * metalRateUsed) + makingCharges + stoneCharges - discount;

        const sale = await Sale.create({
            product: productId,
            customerName,
            customerPhone,
            metalRateUsed,
            makingCharges,
            stoneCharges,
            discount,
            totalPrice,
            paymentMethod,
            soldBy: req.user._id
        });

        // Update product status
        product.status = 'sold';
        await product.save();

        // Log action
        await AuditLog.create({
            user: req.user._id,
            action: 'PRODUCT_SOLD',
            targetModel: 'Sale',
            targetId: sale._id,
            details: `Sold ${product.designName} to ${customerName} for ₹${totalPrice}`
        });

        res.status(201).json(sale);
    } catch (err) {
        res.status(500).json({ message: 'Error recording sale', error: err.message });
    }
};

// @desc    Get all sales
// @route   GET /api/mgmt/sales
const getSales = async (req, res) => {
    try {
        const sales = await Sale.find({})
            .populate('product')
            .populate('soldBy', 'username')
            .sort({ createdAt: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
};

module.exports = { recordSale, getSales };
