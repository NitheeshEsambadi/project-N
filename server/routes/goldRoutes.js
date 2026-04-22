const express = require('express');
const router = express.Router();
const { issueGold, getAllIssues, updateIssueStatus, deleteIssue, updateIssue } = require('../controllers/goldController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllIssues)
    .post(protect, authorize('admin', 'manager'), issueGold);

router.route('/:id')
    .put(protect, authorize('admin', 'manager'), updateIssue)
    .patch(protect, authorize('admin', 'manager'), updateIssueStatus)
    .delete(protect, authorize('admin', 'manager'), deleteIssue);

module.exports = router;
