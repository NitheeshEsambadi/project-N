const express = require('express');
const router = express.Router();
const { issueGold, getAllIssues, updateIssueStatus, deleteIssue } = require('../controllers/goldController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllIssues)
    .post(protect, authorize('admin', 'manager'), issueGold);

router.route('/:id')
    .patch(protect, authorize('admin', 'manager'), updateIssueStatus)
    .delete(protect, authorize('admin', 'manager'), deleteIssue);

module.exports = router;
