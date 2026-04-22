const GoldIssue = require('../models/GoldIssue');
const Worker = require('../models/Worker');

// @desc    Issue gold to a worker
// @route   POST /api/gold
// @access  Private/Admin
exports.issueGold = async (req, res) => {
    try {
        const { workerId, weight, purity, expectedWastage, deliveryDate, notes, stones } = req.body;

        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }

        const goldIssue = new GoldIssue({
            workerId,
            weight,
            purity,
            expectedWastage,
            deliveryDate,
            notes,
            stones
        });

        const savedIssue = await goldIssue.save();
        res.status(201).json(savedIssue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all gold issues
// @route   GET /api/gold
// @access  Private
exports.getAllIssues = async (req, res) => {
    try {
        const { workerId } = req.query;
        const filter = workerId ? { workerId } : {};
        const issues = await GoldIssue.find(filter)
            .populate('workerId', 'name contact specialization workerID')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update gold issue status
// @route   PATCH /api/gold/:id
// @access  Private
exports.updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const issue = await GoldIssue.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update gold issue completely
// @route   PUT /api/gold/:id
// @access  Private/Admin
exports.updateIssue = async (req, res) => {
    try {
        const issue = await GoldIssue.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete gold issue
// @route   DELETE /api/gold/:id
// @access  Private/Admin
exports.deleteIssue = async (req, res) => {
    try {
        const issue = await GoldIssue.findByIdAndDelete(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json({ message: 'Issue removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
