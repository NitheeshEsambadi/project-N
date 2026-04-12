const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Worker = require('./models/Worker');

dotenv.config();

const backfill = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const workers = await Worker.find({ 
            $or: [
                { workerID: null }, 
                { workerID: '' }, 
                { workerID: { $exists: false } }
            ] 
        });

        console.log(`Found ${workers.length} workers to backfill.`);

        for (const w of workers) {
            await w.save(); // Triggers pre-save hook
            console.log(`Backfilled ${w.name} with ID: ${w.workerID}`);
        }

        console.log('Backfill complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

backfill();
