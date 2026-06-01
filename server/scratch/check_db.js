const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'workers' }).toArray();
        
        console.log('--- Collection Info ---');
        console.log(JSON.stringify(collections, null, 2));
        
        const indexes = await db.collection('workers').indexes();
        console.log('--- Indexes ---');
        console.log(JSON.stringify(indexes, null, 2));
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
