const express = require('express');
const router = express.Router();
const { getDashboardStats, getWorkerStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/worker/:id', protect, getWorkerStats);

module.exports = router;
