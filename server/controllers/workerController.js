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
    
    const worker = await Worker.create({
        name,
        contact,
        specialization,
        labourRateType,
        baseRate
    });

    if (worker) {
        res.status(201).json(worker);
    } else {
        res.status(400).json({ message: 'Invalid worker data' });
    }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private (Admin)
const updateWorker = async (req, res) => {
    const worker = await Worker.findById(req.params.id);

    if (worker) {
        worker.name = req.body.name || worker.name;
        worker.contact = req.body.contact || worker.contact;
        worker.specialization = req.body.specialization || worker.specialization;
        worker.labourRateType = req.body.labourRateType || worker.labourRateType;
        worker.baseRate = req.body.baseRate || worker.baseRate;

        const updatedWorker = await worker.save();
        res.json(updatedWorker);
    } else {
        res.status(404).json({ message: 'Worker not found' });
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

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker };
