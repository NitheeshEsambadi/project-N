const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

// Jewellery Management System API
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS: Allow frontend origins (localhost for dev, Vercel URL for production)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now during initial deployment
        }
    },
    credentials: true
}));

// Basic Route
app.get('/', (req, res) => {
    res.send('Jewellery Portal API is running...');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const goldRoutes = require('./routes/goldRoutes');
const statsRoutes = require('./routes/statsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const companyRoutes = require('./routes/companyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/mgmt', require('./routes/mgmtRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
