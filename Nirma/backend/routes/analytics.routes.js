/**
 * ═══════════════════════════════════════════════════════════════
 * ANALYTICS ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// ANALYTICS ENDPOINTS (RESTAURANT MANAGER ONLY)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/analytics/menu-performance
 * Get menu items performance metrics
 */
router.get('/menu-performance', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;

        const result = await query(
            `SELECT 
                mi.id,
                mi.item_name,
                mi.price,
                mi.food_cost,
                mc.category_name,
                COUNT(oi.id) as total_orders,
                ROUND(AVG(mi.rating), 2) as avg_rating,
                ROUND((mi.price - mi.food_cost) / mi.price * 100, 2) as margin_percentage,
                aim.popularity_score,
                aim.classification,
                aim.demand_trend
            FROM menu_items mi
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            LEFT JOIN ai_item_metrics aim ON mi.id = aim.menu_item_id
            WHERE mi.restaurant_id = $1 AND mi.is_active = true
            GROUP BY mi.id, mc.id, aim.id
            ORDER BY total_orders DESC`,
            [restaurantId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching menu performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu performance data'
        });
    }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 */
router.get('/revenue', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;
        const { period = '30' } = req.query; // days

        const result = await query(
            `SELECT 
                DATE(o.created_at) as date,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total_price) as total_revenue,
                SUM(o.subtotal) as subtotal,
                SUM(CASE WHEN o.order_status = 'completed' THEN o.total_price ELSE 0 END) as completed_revenue,
                COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN 1 ELSE NULL END) as cancelled_orders
            FROM orders o
            WHERE o.restaurant_id = $1 AND o.created_at >= NOW() - INTERVAL '1 day' * $2
            GROUP BY DATE(o.created_at)
            ORDER BY date DESC`,
            [restaurantId, period]
        );

        // Calculate totals
        const summary = {
            totalRevenue: 0,
            totalOrders: 0,
            completedRevenue: 0,
            cancelledOrders: 0
        };

        result.rows.forEach(row => {
            summary.totalRevenue += parseFloat(row.total_revenue || 0);
            summary.totalOrders += parseInt(row.total_orders);
            summary.completedRevenue += parseFloat(row.completed_revenue || 0);
            summary.cancelledOrders += parseInt(row.cancelled_orders);
        });

        res.json({
            success: true,
            summary: summary,
            dailyData: result.rows
        });

    } catch (error) {
        console.error('Error fetching revenue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue data'
        });
    }
});

/**
 * GET /api/analytics/top-items
 * Get top selling items
 */
router.get('/top-items', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;
        const { limit = 10 } = req.query;

        const result = await query(
            `SELECT 
                mi.id,
                mi.item_name,
                mi.price,
                mi.icon,
                mc.category_name,
                SUM(oi.quantity) as total_quantity,
                COUNT(DISTINCT oi.order_id) as order_count,
                SUM(oi.subtotal) as total_revenue,
                ROUND(AVG(mi.rating), 2) as rating
            FROM menu_items mi
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            WHERE mi.restaurant_id = $1 AND mi.is_active = true
            GROUP BY mi.id, mc.id
            ORDER BY total_quantity DESC
            LIMIT $2`,
            [restaurantId, limit]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching top items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top items'
        });
    }
});

/**
 * GET /api/analytics/combo-insights
 * Get combo recommendations and performance
 */
router.get('/combo-insights', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;

        const result = await query(
            `SELECT 
                cr.id,
                mi_a.item_name as item_a_name,
                mi_a.price as item_a_price,
                mi_b.item_name as item_b_name,
                mi_b.price as item_b_price,
                cr.support,
                cr.confidence,
                cr.lift,
                cr.combo_discount_percentage,
                cr.frequency_together,
                (mi_a.price + mi_b.price - (mi_a.price + mi_b.price) * cr.combo_discount_percentage / 100) as combo_price
            FROM combo_rules cr
            LEFT JOIN menu_items mi_a ON cr.item_a_id = mi_a.id
            LEFT JOIN menu_items mi_b ON cr.item_b_id = mi_b.id
            WHERE cr.restaurant_id = $1 AND cr.is_active = true
            ORDER BY cr.lift DESC`,
            [restaurantId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching combo insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch combo insights'
        });
    }
});

/**
 * GET /api/analytics/price-recommendations
 * Get AI-powered price recommendations
 */
router.get('/price-recommendations', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;

        const result = await query(
            `SELECT 
                pr.id,
                mi.id as menu_item_id,
                mi.item_name,
                mi.price as current_price,
                pr.suggested_price,
                pr.recommended_price,
                pr.profit_change_percentage,
                pr.confidence_score,
                pr.algorithm_used,
                pr.recommendation_reason,
                pr.is_applied,
                aim.popularity_score,
                aim.classification
            FROM price_recommendations pr
            LEFT JOIN menu_items mi ON pr.menu_item_id = mi.id
            LEFT JOIN ai_item_metrics aim ON mi.id = aim.menu_item_id
            WHERE mi.restaurant_id = $1
            ORDER BY pr.confidence_score DESC`,
            [restaurantId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching price recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price recommendations'
        });
    }
});

module.exports = router;
