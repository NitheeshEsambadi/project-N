const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin/Accountant/Worker)
const getCustomers = async (req, res) => {
    try {
        let customers = await Customer.find({}).sort({ createdAt: -1 });
        if (customers.length === 0) {
            await Customer.insertMany([
                { name: 'Arun Kumar', contact: '98765 43210', email: 'arun@gmail.com', address: '12th Cross, MG Road, Bangalore', outstandingBalance: 45000 },
                { name: 'Priya Sharma', contact: '99887 76655', email: 'priya@yahoo.com', address: 'Gokulam 3rd Stage, Mysore', outstandingBalance: 12000 },
                { name: 'Rohan Mehta', contact: '98450 12345', email: 'rohan.mehta@outlook.com', address: 'Indiranagar, Bangalore', outstandingBalance: 0 }
            ]);
            customers = await Customer.find({}).sort({ createdAt: -1 });
        }
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
    const { name, contact, email, address, gstNumber, outstandingBalance } = req.body;

    try {
        const customer = await Customer.create({
            name,
            contact,
            email,
            address,
            gstNumber,
            outstandingBalance: outstandingBalance || 0
        });

        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Invalid customer data' });
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (req.body.name !== undefined) customer.name = req.body.name;
        if (req.body.contact !== undefined) customer.contact = req.body.contact;
        if (req.body.email !== undefined) customer.email = req.body.email;
        if (req.body.address !== undefined) customer.address = req.body.address;
        if (req.body.gstNumber !== undefined) customer.gstNumber = req.body.gstNumber;
        if (req.body.outstandingBalance !== undefined) customer.outstandingBalance = req.body.outstandingBalance;

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
