const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerID: { type: String, unique: true },
    name: { type: String, required: true },
    contact: { type: String },
    email: { type: String },
    address: { type: String },
    outstandingBalance: { type: Number, default: 0 } // Amount the customer owes the jeweller
}, { timestamps: true });

// Auto-generate numeric customerID (e.g., CUST001, CUST002)
customerSchema.pre('save', async function() {
    if (!this.customerID) {
        const lastCustomer = await mongoose.model('Customer')
            .findOne()
            .sort({ createdAt: -1 })
            .lean();
        
        let nextNum = 1;
        if (lastCustomer && lastCustomer.customerID) {
            const num = parseInt(lastCustomer.customerID.replace(/\D/g, ''), 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
        
        this.customerID = 'CUST' + nextNum.toString().padStart(3, '0');
    }
});

delete mongoose.models.Customer;
const Customer = mongoose.model('Customer', customerSchema);

// Drop old unique indexes if they exist
const dropLegacyIndex = async () => {
    try {
        await mongoose.connection.db.collection('customers').dropIndex('contactNumber_1');
        console.log('Dropped index contactNumber_1 from customers');
    } catch (err) {}
    try {
        await mongoose.connection.db.collection('customers').dropIndex('phone_1');
        console.log('Dropped index phone_1 from customers');
    } catch (err) {}
};

if (mongoose.connection.readyState === 1) {
    dropLegacyIndex();
} else {
    mongoose.connection.on('open', dropLegacyIndex);
}

module.exports = Customer;
