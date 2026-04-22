const Company = require('../models/Company');

// Helper to get or create the global company settings
const getCompanyDoc = async () => {
    let company = await Company.findOne({ isGlobal: true });
    if (!company) {
        // Defaults if completely empty
        company = await Company.create({
            isGlobal: true,
            categories: [
                { name: 'Necklace', code: 'NE' },
                { name: 'Ring', code: 'RI' },
                { name: 'Bangle', code: 'BA' },
                { name: 'Earrings', code: 'EA' }
            ],
            stones: [],
            qrFormat: 'qr'
        });
    }
    return company;
};

// @desc    Get company settings
// @route   GET /api/company
// @access  Private
const getCompany = async (req, res) => {
    try {
        const company = await getCompanyDoc();
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update company settings (Full Update)
// @route   PUT /api/company
// @access  Private (Admin)
const updateCompany = async (req, res) => {
    try {
        const { categories, stones, qrFormat, logo } = req.body;
        const company = await getCompanyDoc();
        
        if (categories) company.categories = categories;
        if (stones) company.stones = stones;
        if (qrFormat) company.qrFormat = qrFormat;
        if (logo !== undefined) company.logo = logo;

        const updated = await company.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getCompany, getCompanyDoc, updateCompany };
