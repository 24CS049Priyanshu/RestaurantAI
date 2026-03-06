/**
 * ═══════════════════════════════════════════════════════════════
 * AUTHENTICATION ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

/**
 * Compare passwords
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// ═══════════════════════════════════════════════════════════════
// CUSTOMER AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/customer/send-otp
 * Send OTP to customer phone number
 */
router.post('/customer/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.length !== 10) {
            return res.status(400).json({
                success: false,
                error: 'Valid 10-digit phone number required'
            });
        }

        // Clean up expired OTPs
        await query(
            'DELETE FROM otp_verifications WHERE expires_at < NOW()',
            []
        );

        // Check for already sent OTP
        const existingOtp = await query(
            'SELECT * FROM otp_verifications WHERE phone = $1 AND is_verified = false',
            [phone]
        );

        if (existingOtp.rows.length > 0 && existingOtp.rows[0].attempts >= 3) {
            return res.status(429).json({
                success: false,
                error: 'Too many OTP attempts. Try again later.'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await query(
            `INSERT INTO otp_verifications (phone, otp_code, expires_at, attempts)
             VALUES ($1, $2, $3, 0)
             ON CONFLICT(phone) DO UPDATE SET 
             otp_code = EXCLUDED.otp_code,
             expires_at = EXCLUDED.expires_at,
             attempts = EXCLUDED.attempts`,
            [phone, otp, expiresAt]
        );

        // In production, send OTP via SMS (Twilio, AWS SNS, etc.)
        console.log(`📱 OTP sent to ${phone}: ${otp}`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            phone: phone,
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { otp: otp })
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP'
        });
    }
});

/**
 * POST /api/auth/customer/verify-otp
 * Verify OTP and create/login customer
 */
router.post('/customer/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Phone and OTP required'
            });
        }

        // Verify OTP
        const result = await query(
            `SELECT * FROM otp_verifications 
             WHERE phone = $1 AND otp_code = $2 AND expires_at > NOW()`,
            [phone, otp]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        // Mark OTP as verified
        await query(
            'UPDATE otp_verifications SET is_verified = true WHERE phone = $1',
            [phone]
        );

        // Check if customer exists
        let customer = await query(
            'SELECT * FROM customers WHERE phone = $1',
            [phone]
        );

        if (customer.rows.length === 0) {
            // Create new customer
            const createResult = await query(
                `INSERT INTO customers (phone, created_at) 
                 VALUES ($1, NOW()) 
                 RETURNING *`,
                [phone]
            );
            customer = createResult;
        } else {
            // Update last login
            await query(
                'UPDATE customers SET last_login = NOW() WHERE phone = $1',
                [phone]
            );
        }

        const customerData = customer.rows[0];
        const token = generateToken({
            id: customerData.id,
            email: customerData.email,
            role: 'customer',
            phone: customerData.phone
        });

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            customer: {
                id: customerData.id,
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email
            }
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP'
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/admin/login
 * Admin login with email and password
 */
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        const result = await query(
            'SELECT * FROM users WHERE email = $1 AND role = $2',
            [email, 'admin']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];
        const passwordMatch = await comparePassword(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// RESTAURANT MANAGER AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/restaurant/login
 * Restaurant manager login with email and password
 */
router.post('/restaurant/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        const result = await query(
            'SELECT u.*, r.name as restaurant_name FROM users u LEFT JOIN restaurants r ON u.restaurant_id = r.id WHERE u.email = $1 AND u.role = $2',
            [email, 'restaurant_manager']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];
        const passwordMatch = await comparePassword(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurant_id,
                restaurantName: user.restaurant_name
            }
        });

    } catch (error) {
        console.error('Error logging in restaurant manager:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

module.exports = router;
