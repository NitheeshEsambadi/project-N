const express = require('express');
const router = express.Router();
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');
const { getTransactions, recordTransaction } = require('../controllers/transactionController');

console.log('--- Mgmt Routes Initialized ---');

router.get('/ping', (req, res) => {
    console.log('[PING] Hit');
    res.send('mgmt routes working');
});
router.get('/auth-ping', protect, (req, res) => res.json({ message: 'Auth working', user: req.user }));

// Gold
const { issueGold, getAllIssues } = require('../controllers/goldController');
router.route('/gold').get(protect, getAllIssues).post(protect, authorize('admin', 'accountant'), issueGold);

// Products
const { createProduct, receiveProduct, getProducts, updateProduct } = require('../controllers/productController');
router.route('/products').get(protect, getProducts).post(protect, authorize('admin', 'accountant'), createProduct);
router.route('/products/:id').put(protect, authorize('admin', 'accountant'), updateProduct);
router.route('/products/:id/receive').put(protect, authorize('admin', 'accountant'), receiveProduct);

router.route('/transactions').get(protect, getTransactions).post(protect, authorize('admin', 'accountant'), recordTransaction);

// Worker Receipts
const { createWorkerReceipt, getWorkerReceipts } = require('../controllers/workerReceiptController');
router.route('/worker-receipts').get(protect, getWorkerReceipts).post(protect, authorize('admin', 'accountant'), createWorkerReceipt);

// System Management
const { clearAllData, getUsers, updateUser } = require('../controllers/systemController');
router.route('/system/clear-data').post(protect, authorize('admin'), clearAllData);
router.route('/system/users').get(protect, authorize('admin'), getUsers);
router.route('/system/users/:id').put(protect, authorize('admin'), updateUser);

// Sales
const { recordSale, getSales } = require('../controllers/saleController');
router.route('/sales').get(protect, getSales).post(protect, authorize('admin', 'accountant'), recordSale);

// Audit
const { getAuditLogs } = require('../controllers/auditController');
router.route('/audit').get(protect, authorize('admin'), getAuditLogs);

module.exports = router;
