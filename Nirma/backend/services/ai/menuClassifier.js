const { pool } = require('../../config/database');

/**
 * Classifies menu items into Star, Plow Horse, Puzzle, or Dog based on Volume and Profitability.
 */
async function classifyMenuItems(restaurantId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Classifying Menu Items for Restaurant ID: ${restaurantId}`);

        // Fetch items and sales data
        const itemsResult = await client.query(`
            SELECT 
                mi.id as menu_item_id, 
                mi.price, 
                mi.food_cost,
                COUNT(oi.id) as total_sold
            FROM menu_items mi
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            WHERE mi.restaurant_id = $1 AND mi.is_active = true
            GROUP BY mi.id
        `, [restaurantId]);

        if (itemsResult.rows.length === 0) {
            return [];
        }

        // Calculate averages for the threshold
        let totalVol = 0;
        let totalMargin = 0;

        const metrics = itemsResult.rows.map(item => {
            const vol = parseInt(item.total_sold || 0);
            const price = parseFloat(item.price || 0);
            const cost = parseFloat(item.food_cost || 0);
            const margin = price - cost;

            totalVol += vol;
            totalMargin += margin;

            return { id: item.menu_item_id, vol, margin, price };
        });

        const avgVol = totalVol / metrics.length;
        const avgMargin = totalMargin / metrics.length;

        const results = [];

        // Clear existing metrics first
        await client.query(`
            DELETE FROM ai_item_metrics 
            WHERE menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = $1)
        `, [restaurantId]);

        for (const item of metrics) {
            let classification = 'dog';

            // Boston Consulting Group (BCG) Matrix adapted for menus (Kasavana/Smith model)
            if (item.vol >= avgVol && item.margin >= avgMargin) {
                classification = 'star'; // High Volume, High Margin
            } else if (item.vol >= avgVol && item.margin < avgMargin) {
                classification = 'plow_horse'; // High Volume, Low Margin
            } else if (item.vol < avgVol && item.margin >= avgMargin) {
                classification = 'puzzle'; // Low Volume, High Margin
            } else {
                classification = 'dog'; // Low Volume, Low Margin
            }

            // Calculate a normalized popularity score (0.0 to 1.0)
            // If avgVol is 0, default to 0. If item.vol is high, cap at 1.0
            const maxVol = Math.max(...metrics.map(m => m.vol));
            const popularity = maxVol > 0 ? (item.vol / maxVol) : 0;
            const marginPct = item.price > 0 ? (item.margin / item.price) * 100 : 0;

            // Assume stable trend for now, a more advanced version would look at time series
            const demandTrend = 'stable';

            await client.query(`
                INSERT INTO ai_item_metrics (menu_item_id, total_orders, margin, popularity_score, classification, demand_trend)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [item.id, item.vol, marginPct, popularity, classification, demandTrend]);

            results.push({
                item_id: item.id,
                classification,
                popularity
            });
        }

        await client.query('COMMIT');
        console.log(`Classified ${results.length} menu items.`);
        return results;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error classifying menu items:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { classifyMenuItems };
