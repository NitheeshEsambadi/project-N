const Worker = require('../models/Worker');

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private (Admin/Accountant)
const getWorkers = async (req, res) => {
    const workers = await Worker.find({}).sort({ createdAt: -1 });
    res.json(workers);
};

// @desc    Get worker by ID
// @route   GET /api/workers/:id
// @access  Private
const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);
        if (worker) {
            res.json(worker);
        } else {
            res.status(404).json({ message: 'Worker not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new worker
// @route   POST /api/workers
// @access  Private (Admin)
const createWorker = async (req, res) => {
    const { name, contact, specialization, labourRateType, baseRate } = req.body;

    try {
        const worker = await Worker.create({
            name,
            contact,
            specialization,
            labourRateType,
            baseRate
        });

        res.status(201).json(worker);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Invalid worker data' });
    }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private (Admin)
const updateWorker = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }

        // Update all editable fields
        if (req.body.name !== undefined) worker.name = req.body.name;
        if (req.body.contact !== undefined) worker.contact = req.body.contact;
        if (req.body.specialization !== undefined) worker.specialization = req.body.specialization;
        if (req.body.labourRateType !== undefined) worker.labourRateType = req.body.labourRateType;
        if (req.body.baseRate !== undefined) worker.baseRate = req.body.baseRate;

        const updatedWorker = await worker.save();
        res.json(updatedWorker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete worker
// @route   DELETE /api/workers/:id
// @access  Private (Admin)
const deleteWorker = async (req, res) => {
    const worker = await Worker.findById(req.params.id);

    if (worker) {
        await worker.deleteOne();
        res.json({ message: 'Worker removed' });
    } else {
        res.status(404).json({ message: 'Worker not found' });
    }
};

// @desc    Backfill workerIDs for existing workers that don't have one
// @route   POST /api/workers/backfill-ids
// @access  Private (Admin)
const backfillWorkerIDs = async (req, res) => {
    try {
        const workersWithoutID = await Worker.find({ $or: [{ workerID: null }, { workerID: '' }, { workerID: { $exists: false } }] }).sort({ createdAt: 1 });

        if (workersWithoutID.length === 0) {
            return res.json({ message: 'All workers already have IDs', updated: 0 });
        }

        let updated = 0;
        for (const worker of workersWithoutID) {
            // The pre-save hook will auto-generate the ID
            await worker.save();
            updated++;
        }

        res.json({ message: `Backfilled ${updated} worker IDs`, updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker, backfillWorkerIDs };
