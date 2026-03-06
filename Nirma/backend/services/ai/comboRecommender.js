const { pool } = require('../../config/database');

/**
 * Generates Combo Recommendations using a simplified Apriori algorithm
 * Finding frequent item pairs (item_a, item_b) and calculating Support, Confidence, Lift.
 */
async function generateComboRules(restaurantId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Generating Combo Recommendations for Restaurant ID: ${restaurantId}`);

        // 1. Get total number of orders for the restaurant
        const totalOrdersResult = await client.query(
            'SELECT COUNT(*) as count FROM orders WHERE restaurant_id = $1 AND order_status = $2',
            [restaurantId, 'completed']
        );
        const totalOrders = parseInt(totalOrdersResult.rows[0].count);

        if (totalOrders === 0) {
            console.log('No completed orders found to analyze.');
            return [];
        }

        // 2. Fetch all order items grouped by order_id
        const orderItemsResult = await client.query(`
            SELECT oi.order_id, oi.menu_item_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.restaurant_id = $1 AND o.order_status = 'completed'
        `, [restaurantId]);

        // Build a map of order_id -> array of menu_item_ids
        const transactions = {};
        for (const row of orderItemsResult.rows) {
            if (!transactions[row.order_id]) transactions[row.order_id] = new Set();
            transactions[row.order_id].add(row.menu_item_id);
        }

        const transactionList = Object.values(transactions).map(set => Array.from(set));

        // 3. Calculate Item Frequencies (Support for individual items)
        const itemFrequencies = {};
        for (const items of transactionList) {
            for (const item of items) {
                itemFrequencies[item] = (itemFrequencies[item] || 0) + 1;
            }
        }

        // 4. Calculate Pair Frequencies (item_a -> item_b)
        const pairFrequencies = {};
        for (const items of transactionList) {
            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    const itemA = items[i];
                    const itemB = items[j];
                    const pairKey1 = `${itemA}_${itemB}`;
                    const pairKey2 = `${itemB}_${itemA}`;

                    pairFrequencies[pairKey1] = (pairFrequencies[pairKey1] || 0) + 1;
                    pairFrequencies[pairKey2] = (pairFrequencies[pairKey2] || 0) + 1;
                }
            }
        }

        // 5. Calculate Metrics and Insert Rules
        // Clear old rules for this restaurant
        await client.query('DELETE FROM combo_rules WHERE restaurant_id = $1', [restaurantId]);

        const minSupport = 0.05; // 5% minimum support
        const generatedRules = [];

        for (const pairKey in pairFrequencies) {
            const [itemA, itemB] = pairKey.split('_').map(Number);
            const pairCount = pairFrequencies[pairKey];
            const supportA = itemFrequencies[itemA] / totalOrders;
            const supportB = itemFrequencies[itemB] / totalOrders;
            const supportAB = pairCount / totalOrders;

            // Apriori Metrics
            const confidence = supportAB / supportA;
            const lift = confidence / supportB;

            // Only keep rules with significant metrics
            if (supportAB >= minSupport && lift > 1.0) {
                // Calculate an automatic combo discount (min 5%, max 20% based on lift)
                const discount = Math.min(20, Math.max(5, Math.floor(lift * 5)));

                generatedRules.push({ itemA, itemB, supportAB, confidence, lift, discount, pairCount });

                // Insert into database
                await client.query(`
                    INSERT INTO combo_rules (restaurant_id, item_a_id, item_b_id, support, confidence, lift, combo_discount_percentage, frequency_together, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                    ON CONFLICT (restaurant_id, item_a_id, item_b_id) 
                    DO UPDATE SET support = $4, confidence = $5, lift = $6, combo_discount_percentage = $7, frequency_together = $8, updated_at = NOW();
                `, [restaurantId, itemA, itemB, supportAB, confidence, lift, discount, pairCount]);
            }
        }

        await client.query('COMMIT');
        console.log(`Generated ${generatedRules.length} strong combo recommendations.`);
        return generatedRules;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in combo recommender:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { generateComboRules };
