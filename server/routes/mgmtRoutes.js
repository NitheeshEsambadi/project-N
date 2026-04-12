const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Gold
const { issueGold, getAllIssues } = require('../controllers/goldController');
router.route('/gold').get(protect, getAllIssues).post(protect, authorize('admin', 'accountant'), issueGold);

// Products
const { createProduct, receiveProduct, getProducts } = require('../controllers/productController');
router.route('/products').get(protect, getProducts).post(protect, authorize('admin', 'accountant'), createProduct);
router.route('/products/:id/receive').put(protect, authorize('admin', 'accountant'), receiveProduct);

// Transactions
const { getTransactions, recordTransaction } = require('../controllers/transactionController');
router.route('/transactions').get(protect, getTransactions).post(protect, authorize('admin', 'accountant'), recordTransaction);

module.exports = router;
