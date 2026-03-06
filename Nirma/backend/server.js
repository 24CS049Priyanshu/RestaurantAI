/**
 * ═══════════════════════════════════════════════════════════════
 * RESTAURANT MANAGEMENT SYSTEM - EXPRESS SERVER
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Path to frontend folder (one level up from backend)
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

// Import routes
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');

// Initialize Express app + HTTP server + Socket.io
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Export io so routes can emit events
module.exports.io = io;

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend files
app.use(express.static(FRONTEND_PATH));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ═══════════════════════════════════════════════════════════════
// SOCKET.IO — ROOM MANAGEMENT
// ═══════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client sends { role: 'admin' } or { role: 'restaurant_manager', restaurantId: '...' }
    socket.on('join', (data) => {
        if (data.role === 'admin') {
            socket.join('admin-room');
            console.log(`✅ Admin joined admin-room [${socket.id}]`);
        } else if (data.role === 'restaurant_manager' && data.restaurantId) {
            const room = `restaurant-${data.restaurantId}-room`;
            socket.join(room);
            console.log(`✅ Manager joined ${room} [${socket.id}]`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// Authentication routes
app.use('/api/auth', authRoutes);

// Menu routes
app.use('/api/menu', menuRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Customer routes
app.use('/api/customer', customerRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404 Not Found middleware
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ═══════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║  🍜 Restaurant Management System Backend              ║
    ║  Server running on: http://localhost:${PORT}             ║
    ║  Environment: ${process.env.NODE_ENV}                      ║
    ║  Socket.io: ✅ Enabled                                ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
