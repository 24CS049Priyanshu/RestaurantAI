/**
 * ═══════════════════════════════════════════════════════════════
 * CUSTOMER ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// CUSTOMER ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/customer/profile
 * Get customer profile
 */
router.get('/profile', verifyToken, verifyRole(['customer']), async (req, res) => {
    try {
        const { id } = req.user;

        const result = await query(
            'SELECT id, name, phone, email, address, city, postal_code, created_at FROM customers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching customer profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

/**
 * PUT /api/customer/profile
 * Update customer profile
 */
router.put('/profile', verifyToken, verifyRole(['customer']), async (req, res) => {
    try {
        const { id } = req.user;
        const { name, email, address, city, postalCode } = req.body;

        const result = await query(
            `UPDATE customers 
            SET name = COALESCE($2, name),
                email = COALESCE($3, email),
                address = COALESCE($4, address),
                city = COALESCE($5, city),
                postal_code = COALESCE($6, postal_code),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *`,
            [id, name, email, address, city, postalCode]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating customer profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

/**
 * GET /api/customer/orders
 * Get customer orders
 */
router.get('/orders', verifyToken, verifyRole(['customer']), async (req, res) => {
    try {
        const { id } = req.user;

        const result = await query(
            `SELECT 
                o.id,
                o.order_status,
                o.total_price,
                o.delivery_type,
                o.created_at,
                r.name as restaurant_name,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.customer_id = $1
            GROUP BY o.id, r.id
            ORDER BY o.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

/**
 * GET /api/customer/favorites
 * Get customer favorite items (based on order history)
 */
router.get('/favorites', verifyToken, verifyRole(['customer']), async (req, res) => {
    try {
        const { id } = req.user;

        const result = await query(
            `SELECT DISTINCT
                mi.id,
                mi.item_name,
                mi.price,
                mi.icon,
                mc.category_name,
                COUNT(oi.id) as order_count,
                ROUND(AVG(mi.rating), 2) as rating
            FROM menu_items mi
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.customer_id = $1
            GROUP BY mi.id, mc.id
            ORDER BY order_count DESC
            LIMIT 10`,
            [id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch favorites'
        });
    }
});

module.exports = router;
