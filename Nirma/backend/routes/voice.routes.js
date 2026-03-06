const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { parseCommand } = require('../services/nlp/commandParser');

/**
 * POST /api/voice/process
 * Receives speech-to-text transcription, runs NLP, and returns mapped items
 */
router.post('/process', async (req, res) => {
    try {
        const { transcription, restaurant_id } = req.body;

        if (!transcription || !restaurant_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        console.log(`[Voice API] Received from frontend: "${transcription}"`);

        // Fetch menu items to act as dictionary
        const menuResult = await pool.query(
            'SELECT id, item_name, price FROM menu_items WHERE restaurant_id = $1 AND is_active = true',
            [restaurant_id]
        );
        const menuItemsDb = menuResult.rows;

        // Parse command
        const parsedOrder = await parseCommand(transcription, menuItemsDb);

        res.json({
            success: true,
            parsedOrder,
            message: parsedOrder.items.length > 0 ? 'Order parsed successfully' : 'Could not understand order items'
        });
    } catch (error) {
        console.error('[Voice API] Error processing voice order:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/voice/submit
 * Submits the parsed voice order to the database (called after customer confirms)
 */
router.post('/submit', async (req, res) => {
    const client = await pool.connect();
    try {
        const { restaurant_id, customer_id, items, transcription, confidence } = req.body;

        await client.query('BEGIN');

        let subtotal = 0;
        items.forEach(i => subtotal += (i.price * i.quantity));
        const total = subtotal; // Delivery fee handling not included here

        // Insert Order
        const orderRes = await client.query(`
            INSERT INTO orders (restaurant_id, customer_id, order_status, subtotal, total_price)
            VALUES ($1, $2, 'pending', $3, $4)
            RETURNING id
        `, [restaurant_id, customer_id, subtotal, total]);

        const orderId = orderRes.rows[0].id;

        // Note: Instead of storing everything in `orders`, there's a `voice_orders` table 
        // in `restaurant_ai_schema.sql` we could use, or just flag it via `orders.channel`.
        // Let's insert into `voice_orders` if it exists.

        // Insert Items
        for (const item of items) {
            await client.query(`
                INSERT INTO order_items (order_id, menu_item_id, quantity, item_price, subtotal)
                VALUES ($1, $2, $3, $4, $5)
            `, [orderId, item.menu_item_id, item.quantity, item.price, item.price * item.quantity]);
        }

        // Map to voice_orders for AI tracking
        await client.query(`
            INSERT INTO voice_orders (restaurant_id, customer_id, order_id, transcription, confidence_score, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
        `, [restaurant_id, customer_id, orderId, transcription, confidence || 85]);

        await client.query('COMMIT');

        // If socket.io is attached to req, emit event
        if (req.io) {
            req.io.to(`restaurant_${restaurant_id}`).emit('new_voice_order', {
                orderId,
                total,
                status: 'pending'
            });
        }

        res.json({ success: true, orderId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Voice API] Error submitting order:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    } finally {
        client.release();
    }
});

module.exports = router;
