const express = require('express');
const router = express.Router();
const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCompany)
    .put(protect, authorize('admin'), updateCompany);

module.exports = router;
