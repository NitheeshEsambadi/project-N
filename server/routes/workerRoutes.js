const express = require('express');
const router = express.Router();
const { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker } = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'accountant'), getWorkers)
    .post(protect, authorize('admin'), createWorker);

router.route('/:id')
    .get(protect, getWorkerById)
    .put(protect, authorize('admin'), updateWorker)
    .delete(protect, authorize('admin'), deleteWorker);

module.exports = router;
