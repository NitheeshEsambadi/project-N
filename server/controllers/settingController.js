const Setting = require('../models/Setting');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.find({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upsert a setting
// @route   POST /api/settings
// @access  Private (Admin)
exports.updateSetting = async (req, res) => {
    try {
        const { key, value, description } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, description },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
