/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard', verifyToken, verifyRole(['admin']), async (req, res) => {
    try {
        // Total restaurants
        const restaurantsResult = await query(
            'SELECT COUNT(*) as total FROM restaurants WHERE is_active = true',
            []
        );

        // Total orders
        const ordersResult = await query(
            'SELECT COUNT(*) as total, SUM(total_price) as revenue FROM orders WHERE order_status = $1',
            ['completed']
        );

        // Total customers
        const customersResult = await query(
            'SELECT COUNT(*) as total FROM customers WHERE is_active = true',
            []
        );

        // Total menu items
        const itemsResult = await query(
            'SELECT COUNT(*) as total FROM menu_items WHERE is_active = true',
            []
        );

        res.json({
            success: true,
            data: {
                restaurants: parseInt(restaurantsResult.rows[0].total),
                orders: parseInt(ordersResult.rows[0].total),
                revenue: parseFloat(ordersResult.rows[0].revenue || 0),
                customers: parseInt(customersResult.rows[0].total),
                menu_items: parseInt(itemsResult.rows[0].total)
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data'
        });
    }
});

/**
 * GET /api/admin/restaurants
 * Get all restaurants
 */
router.get('/restaurants', verifyToken, verifyRole(['admin']), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                r.id,
                r.name,
                r.location,
                r.contact_number,
                r.email,
                r.cuisine_type,
                r.is_active,
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT u.id) as staff_count,
                COUNT(DISTINCT mi.id) as menu_items_count
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            LEFT JOIN users u ON r.id = u.restaurant_id
            LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
            GROUP BY r.id
            ORDER BY r.created_at DESC`,
            []
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch restaurants'
        });
    }
});

/**
 * GET /api/admin/users
 * Get all system users
 */
router.get('/users', verifyToken, verifyRole(['admin']), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.role,
                u.is_active,
                r.name as restaurant_name,
                u.created_at
            FROM users u
            LEFT JOIN restaurants r ON u.restaurant_id = r.id
            ORDER BY u.created_at DESC`,
            []
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

/**
 * GET /api/admin/orders
 * Get all system orders
 */
router.get('/orders', verifyToken, verifyRole(['admin']), async (req, res) => {
    try {
        const { status } = req.query;

        let queryText = `
            SELECT 
                o.id,
                o.customer_id,
                c.name as customer_name,
                c.phone,
                r.name as restaurant_name,
                o.order_status,
                o.total_price,
                o.created_at
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
        `;

        let params = [];

        if (status) {
            queryText += ` WHERE o.order_status = $1`;
            params.push(status);
        }

        queryText += ' ORDER BY o.created_at DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

/**
 * GET /api/admin/system-analytics
 * Get system-wide analytics
 */
router.get('/system-analytics', verifyToken, verifyRole(['admin']), async (req, res) => {
    try {
        // Revenue by restaurant
        const revenueByRestaurant = await query(
            `SELECT 
                r.name,
                COUNT(o.id) as orders,
                SUM(o.total_price) as revenue
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id AND o.order_status = 'completed'
            GROUP BY r.id
            ORDER BY revenue DESC`,
            []
        );

        // Top menu items across system
        const topItems = await query(
            `SELECT 
                mi.item_name,
                r.name as restaurant_name,
                SUM(oi.quantity) as total_orders,
                ROUND(SUM(oi.subtotal), 2) as revenue
            FROM menu_items mi
            LEFT JOIN restaurants r ON mi.restaurant_id = r.id
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            WHERE mi.is_active = true
            GROUP BY mi.id, r.id
            ORDER BY total_orders DESC
            LIMIT 20`,
            []
        );

        // Order trends
        const orderTrends = await query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(total_price) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC`,
            []
        );

        res.json({
            success: true,
            data: {
                revenueByRestaurant: revenueByRestaurant.rows,
                topItems: topItems.rows,
                orderTrends: orderTrends.rows
            }
        });

    } catch (error) {
        console.error('Error fetching system analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});

module.exports = router;
