/**
 * ═══════════════════════════════════════════════════════════════
 * ORDER ROUTES
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { verifyToken, verifyRole } = require('../middleware/auth');

// io is set after server boots — require lazily
function getIO() {
    return require('../server').io;
}


// ═══════════════════════════════════════════════════════════════
// ORDER ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', verifyToken, verifyRole(['customer']), async (req, res) => {
    try {
        const {
            restaurantId,
            items,
            deliveryAddress,
            deliveryType,
            specialInstructions,
            paymentMethod
        } = req.body;

        const customerId = req.user.id;

        if (!restaurantId || !items || items.length === 0 || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Use transaction for order creation
        const result = await transaction(async (client) => {
            // Calculate order total
            let subtotal = 0;
            const itemsData = [];

            for (const item of items) {
                const menuItemResult = await client.query(
                    'SELECT price FROM menu_items WHERE id = $1',
                    [item.menuItemId]
                );

                if (menuItemResult.rows.length === 0) {
                    throw new Error(`Menu item ${item.menuItemId} not found`);
                }

                const itemPrice = menuItemResult.rows[0].price;
                const itemSubtotal = itemPrice * item.quantity;
                subtotal += itemSubtotal;

                itemsData.push({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    itemPrice: itemPrice,
                    subtotal: itemSubtotal
                });
            }

            const tax = Math.round(subtotal * 0.05 * 100) / 100;
            const deliveryFee = 40;
            const totalPrice = subtotal + tax + deliveryFee;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders 
                (customer_id, restaurant_id, subtotal, tax, delivery_fee, total_price, delivery_address, delivery_type, special_instructions)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [customerId, restaurantId, subtotal, tax, deliveryFee, totalPrice, deliveryAddress, deliveryType || 'home', specialInstructions]
            );

            const orderId = orderResult.rows[0].id;

            // Create order items
            for (const item of itemsData) {
                await client.query(
                    `INSERT INTO order_items 
                    (order_id, menu_item_id, quantity, item_price, subtotal)
                    VALUES ($1, $2, $3, $4, $5)`,
                    [orderId, item.menuItemId, item.quantity, item.itemPrice, item.subtotal]
                );
            }

            // Create payment record
            if (paymentMethod) {
                await client.query(
                    `INSERT INTO payments 
                    (order_id, payment_method, payment_status, amount_paid)
                    VALUES ($1, $2, 'pending', $3)`,
                    [orderId, paymentMethod, totalPrice]
                );
            }

            return orderResult.rows[0];
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: result
        });

        // ── Real-time broadcast to dashboards ──────────────────────────
        try {
            const io = getIO();
            if (io) {
                const payload = {
                    orderId: result.id,
                    restaurantId: result.restaurant_id,
                    customerId: result.customer_id,
                    totalPrice: result.total_price,
                    status: result.order_status,
                    createdAt: result.created_at,
                    deliveryType: result.delivery_type
                };

                // Notify ALL admins
                io.to('admin-room').emit('new_order', payload);

                // Notify the relevant restaurant manager
                io.to(`restaurant-${result.restaurant_id}-room`).emit('new_order', payload);

                console.log(`📡 Broadcasted new_order #${result.id} to admin-room & restaurant-${result.restaurant_id}-room`);
            }
        } catch (broadcastErr) {
            console.error('Socket broadcast error (non-fatal):', broadcastErr.message);
        }

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
});

/**
 * GET /api/orders
 * Get orders (customer or restaurant manager)
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        let queryText = '';
        let params = [];

        if (req.user.role === 'customer') {
            queryText = `
                SELECT 
                    o.id,
                    o.order_status,
                    o.total_price,
                    o.created_at,
                    r.name as restaurant_name,
                    COUNT(oi.id) as item_count
                FROM orders o
                LEFT JOIN restaurants r ON o.restaurant_id = r.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_id = $1
                GROUP BY o.id, r.id
                ORDER BY o.created_at DESC
            `;
            params = [req.user.id];
        } else if (req.user.role === 'restaurant_manager') {
            queryText = `
                SELECT 
                    o.id,
                    o.order_status,
                    o.total_price,
                    o.created_at,
                    c.name as customer_name,
                    c.phone,
                    COUNT(oi.id) as item_count
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.restaurant_id = $1
                GROUP BY o.id, c.id
                ORDER BY o.created_at DESC
            `;
            params = [req.user.restaurantId];
        }

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
 * GET /api/orders/:id
 * Get single order details
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await query(
            `SELECT 
                o.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                r.name as restaurant_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get order items
        const itemsResult = await query(
            `SELECT 
                oi.id,
                oi.quantity,
                oi.item_price,
                oi.subtotal,
                oi.special_requests,
                mi.item_name,
                mi.icon
            FROM order_items oi
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = $1`,
            [id]
        );

        const order = orderResult.rows[0];
        order.items = itemsResult.rows;

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (Restaurant Manager only)
 */
router.put('/:id/status', verifyToken, verifyRole(['restaurant_manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const result = await query(
            `UPDATE orders 
            SET order_status = $2, updated_at = NOW()
            WHERE id = $1 AND restaurant_id = $3
            RETURNING *`,
            [id, status, req.user.restaurantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            data: result.rows[0]
        });

        // ── Real-time broadcast to dashboards ──────────────────────────
        try {
            const io = getIO();
            if (io) {
                const payload = {
                    orderId: id,
                    restaurantId: req.user.restaurantId,
                    status: status,
                    updatedAt: result.rows[0].updated_at
                };

                // Notify admin and restaurant manager
                io.to('admin-room').emit('order_status_updated', payload);
                io.to(`restaurant-${req.user.restaurantId}-room`).emit('order_status_updated', payload);

                // Notify the specific customer
                io.to(`customer-${result.rows[0].customer_id}-room`).emit('order_status_updated', payload);

                console.log(`📡 Broadcasted status update for #${id} to ${status}`);
            }
        } catch (broadcastErr) {
            console.error('Socket broadcast error:', broadcastErr.message);
        }

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
});

module.exports = router;
