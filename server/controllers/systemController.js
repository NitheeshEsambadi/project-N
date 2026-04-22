const Worker = require('../models/Worker');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const GoldIssue = require('../models/GoldIssue');
const User = require('../models/User');

// @desc    Clear all application data (Products, Transactions, Gold Issues, Workers)
// @route   POST /api/mgmt/clear-data
// @access  Private/Admin
const clearAllData = async (req, res) => {
    try {
        // We do NOT clear Users (admin needed to stay logged in) 
        // We do NOT clear Settings (business config stays)
        
        await Promise.all([
            Product.deleteMany({}),
            Transaction.deleteMany({}),
            GoldIssue.deleteMany({}),
            Worker.deleteMany({})
        ]);

        res.json({ message: 'All transaction and production data has been cleared.' });
    } catch (err) {
        res.status(500).json({ message: 'Error clearing data', error: err.message });
    }
};

// @desc    Get all users (for management)
// @route   GET /api/mgmt/users
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Update user permissions/role
// @route   PUT /api/mgmt/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = req.body.role || user.role;
        user.permissions = req.body.permissions || user.permissions;
        
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            role: updatedUser.role,
            permissions: updatedUser.permissions
        });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

module.exports = {
    clearAllData,
    getUsers,
    updateUser
};
