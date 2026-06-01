const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    console.log(`[PROTECT] Request: ${req.method} ${req.originalUrl}`);
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log(`[PROTECT] Token found: ${token.substring(0, 10)}...`);
            
            // Bypass for development if mock-token is provided
            if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
                req.user = { _id: '600000000000000000000001', username: 'admin', role: 'admin' };
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`[AUTHORIZE] Roles: ${roles}, User Role: ${req.user.role}`);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized` });
        }
        next();
    };
};

const hasPermission = (permission) => {
    return (req, res, next) => {
        // Admin always has all permissions
        if (req.user.role === 'admin') return next();
        
        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = { protect, authorize, hasPermission };
