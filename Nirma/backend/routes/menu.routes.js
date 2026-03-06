/**
 * ═══════════════════════════════════════════════════════════════
 * MENU ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// PUBLIC MENU ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/menu/items
 * Get all menu items or filtered by restaurant/category
 */
router.get('/items', async (req, res) => {
    try {
        const { restaurantId, categoryId, search } = req.query;

        let queryText = `
            SELECT 
                mi.id,
                mi.item_name,
                mi.description,
                mi.icon,
                mi.price,
                mi.rating,
                mi.reviews_count,
                mi.is_vegetarian,
                mi.is_spicy,
                mc.category_name,
                r.name as restaurant_name
            FROM menu_items mi
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            LEFT JOIN restaurants r ON mi.restaurant_id = r.id
            WHERE mi.is_active = true AND mi.availability = true
        `;

        let params = [];
        let paramIndex = 1;

        if (restaurantId) {
            queryText += ` AND mi.restaurant_id = $${paramIndex}`;
            params.push(restaurantId);
            paramIndex++;
        }

        if (categoryId) {
            queryText += ` AND mi.category_id = $${paramIndex}`;
            params.push(categoryId);
            paramIndex++;
        }

        if (search) {
            queryText += ` AND (mi.item_name ILIKE $${paramIndex} OR mi.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        queryText += ' ORDER BY mi.rating DESC, mi.reviews_count DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu items'
        });
    }
});

/**
 * GET /api/menu/categories
 * Get all menu categories
 */
router.get('/categories', async (req, res) => {
    try {
        const { restaurantId } = req.query;

        let queryText = `
            SELECT DISTINCT
                mc.id,
                mc.category_name,
                mc.display_order
            FROM menu_categories mc
            WHERE mc.is_active = true
        `;

        let params = [];

        if (restaurantId) {
            queryText += ` AND mc.restaurant_id = $1`;
            params.push(restaurantId);
        }

        queryText += ' ORDER BY mc.display_order ASC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

/**
 * GET /api/menu/item/:id
 * Get single menu item details
 */
router.get('/item/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT 
                mi.*,
                mc.category_name,
                r.name as restaurant_name,
                aim.popularity_score,
                aim.margin,
                aim.classification
            FROM menu_items mi
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            LEFT JOIN restaurants r ON mi.restaurant_id = r.id
            LEFT JOIN ai_item_metrics aim ON mi.id = aim.menu_item_id
            WHERE mi.id = $1 AND mi.is_active = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu item'
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// PROTECTED MENU ENDPOINTS (RESTAURANT MANAGER)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/menu/item
 * Create new menu item (Restaurant Manager only)
 */
router.post('/item', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const {
            categoryId,
            itemName,
            description,
            icon,
            price,
            foodCost,
            isVegetarian,
            isSpicy,
            prepTimeMinutes
        } = req.body;

        const restaurantId = req.user.restaurantId;

        if (!categoryId || !itemName || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await query(
            `INSERT INTO menu_items 
            (restaurant_id, category_id, item_name, description, icon, price, food_cost, is_vegetarian, is_spicy, prep_time_minutes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [restaurantId, categoryId, itemName, description, icon, price, foodCost, isVegetarian, isSpicy, prepTimeMinutes]
        );

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create menu item'
        });
    }
});

/**
 * PUT /api/menu/item/:id
 * Update menu item (Restaurant Manager only)
 */
router.put('/item/:id', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, description, price, foodCost, availability, isVegetarian, isSpicy } = req.body;

        const result = await query(
            `UPDATE menu_items 
            SET item_name = COALESCE($2, item_name),
                description = COALESCE($3, description),
                price = COALESCE($4, price),
                food_cost = COALESCE($5, food_cost),
                availability = COALESCE($6, availability),
                is_vegetarian = COALESCE($7, is_vegetarian),
                is_spicy = COALESCE($8, is_spicy),
                updated_at = NOW()
            WHERE id = $1 AND restaurant_id = $9
            RETURNING *`,
            [id, itemName, description, price, foodCost, availability, isVegetarian, isSpicy, req.user.restaurantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update menu item'
        });
    }
});

/**
 * DELETE /api/menu/item/:id
 * Delete menu item (Restaurant Manager only)
 */
router.delete('/item/:id', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE menu_items 
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND restaurant_id = $2
            RETURNING id`,
            [id, req.user.restaurantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete menu item'
        });
    }
});

module.exports = router;
