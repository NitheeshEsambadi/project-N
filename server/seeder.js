const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Worker = require('./models/Worker');
const GoldIssue = require('./models/GoldIssue');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Worker.deleteMany();
        await GoldIssue.deleteMany();
        await Product.deleteMany();
        await Transaction.deleteMany();

        // 1. Create Default Admin
        const adminUser = await User.create({
            username: 'admin',
            password: process.env.ADMIN_PASSWORD || 'password123',
            role: 'admin',
            email: 'admin@jewellery.com'
        });

        // 2. Create Sample Workers
        const workers = await Worker.insertMany([
            { name: 'Sameer Khan', contact: '9876543210', specialization: 'Necklace Specialist', labourRateType: 'perGram', baseRate: 150 },
            { name: 'Amit Verma', contact: '9822334455', specialization: 'Ring Expert', labourRateType: 'perPiece', baseRate: 500 },
            { name: 'Rajesh Kumar', contact: '9123456789', specialization: 'Polishing & Finish', labourRateType: 'fixed', baseRate: 1200 }
        ]);

        console.log('--- Workers Created ---');

        // 3. Create Sample Gold Issues
        const goldIssues = await GoldIssue.insertMany([
            {
                workerId: workers[0]._id,
                weight: 250.5,
                purity: '22k',
                expectedWastage: 5.2,
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
                status: 'issued',
                notes: 'Issue for Bridal Necklace design #102'
            },
            {
                workerId: workers[1]._id,
                weight: 15.0,
                purity: '18k',
                expectedWastage: 2.0,
                deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                status: 'completed',
                notes: 'Engagement ring project'
            }
        ]);

        console.log('--- Gold Issues Created ---');

        // 4. Create Sample Products
        const products = await Product.insertMany([
            {
                productId: 'PRD-001',
                category: 'Necklace',
                designName: 'Majesty Gold',
                expectedWeight: 240,
                workerId: workers[0]._id,
                status: 'in-progress',
                notes: 'Use antique finish as per customer request'
            },
            {
                productId: 'PRD-002',
                category: 'Ring',
                designName: 'Classic Solitaire',
                expectedWeight: 14.5,
                workerId: workers[1]._id,
                status: 'completed',
                grossWeight: 14.8,
                netWeight: 14.2,
                actualWastage: 2.1,
                qualityCheck: 'passed',
                notes: 'Standard 6-prong setting'
            }
        ]);

        console.log('--- Products Created ---');

        // 5. Create Sample Transactions
        await Transaction.insertMany([
            {
                workerId: workers[1]._id,
                type: 'earning',
                amount: 500,
                paymentMode: 'Bank',
                referenceId: products[1]._id,
                notes: 'Labour for Solitaire Ring'
            },
            {
                workerId: workers[1]._id,
                type: 'payment',
                amount: 300,
                paymentMode: 'Cash',
                notes: 'Advance payment'
            }
        ]);

        console.log('--- Transactions Created ---');

        console.log('Data Successfully Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error with seeding: ${error}`);
        process.exit(1);
    }
};

importData();
