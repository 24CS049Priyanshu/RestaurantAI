const { pool } = require('../../config/database');

/**
 * Generates Price Recommendations based on simulated demand elasticity
 */
async function generatePriceRecommendations(restaurantId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Generating Price Optimization for Restaurant ID: ${restaurantId}`);

        // 1. Fetch current menu items and their recent performance
        const itemsResult = await client.query(`
            SELECT 
                mi.id as menu_item_id, 
                mi.item_name, 
                mi.price as current_price, 
                mi.food_cost,
                COUNT(oi.id) as total_sold
            FROM menu_items mi
            LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
            WHERE mi.restaurant_id = $1 AND mi.is_active = true
            GROUP BY mi.id
        `, [restaurantId]);

        // 2. Calculate average demand across all items
        let totalSoldVol = 0;
        itemsResult.rows.forEach(r => totalSoldVol += parseInt(r.total_sold || 0));
        const avgSoldVol = totalSoldVol / (itemsResult.rows.length || 1);

        // Clear existing recommendations
        await client.query(`
            DELETE FROM price_recommendations 
            WHERE menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = $1)
        `, [restaurantId]);

        const generated = [];

        // 3. Simple Elasticity Model
        for (const item of itemsResult.rows) {
            const soldVol = parseInt(item.total_sold || 0);
            const currentPrice = parseFloat(item.current_price);
            const foodCost = parseFloat(item.food_cost || 0);
            const currentMarginPct = currentPrice > 0 ? ((currentPrice - foodCost) / currentPrice) * 100 : 0;

            let recommendationReason = '';
            let newPrice = currentPrice;
            let algName = '';
            let confidence = 0;

            if (soldVol > avgSoldVol * 1.5) {
                // High demand -> Room to increase price
                newPrice = currentPrice * 1.10; // +10%
                recommendationReason = 'High demand velocity. Price inelasticity detected; increasing price could maximize margin.';
                algName = 'Demand-Elasticity (Surge)';
                confidence = 0.85;
            } else if (soldVol < avgSoldVol * 0.5 && currentMarginPct > 40) {
                // Low demand, but good margin -> We can afford to discount
                newPrice = currentPrice * 0.90; // -10%
                recommendationReason = 'Low demand velocity. High margin allows for a promotional discount to drive volume.';
                algName = 'Volume-Driver (Discount)';
                confidence = 0.75;
            } else if (currentMarginPct < 30) {
                // Low margin -> Needs price bump to survive
                newPrice = currentPrice * 1.15; // +15%
                recommendationReason = 'Critically low profit margin. Suggested increase to maintain viability.';
                algName = 'Margin-Protection';
                confidence = 0.90;
            } else {
                // Stable
                newPrice = currentPrice;
                recommendationReason = 'Demand and margin are stable. No price change recommended at this time.';
                algName = 'Stable-Equilibrium';
                confidence = 0.95;
            }

            // Standardize price (round to nearest whole number, e.g., 99 or 100)
            const recommendedPrice = Math.floor(newPrice);
            const suggestedPrice = recommendedPrice;
            const profitChangePct = currentPrice > 0 ? ((suggestedPrice - currentPrice) / currentPrice) * 100 : 0;

            generated.push({ id: item.menu_item_id, recommendedPrice });

            if (recommendedPrice !== currentPrice) {
                await client.query(`
                    INSERT INTO price_recommendations 
                        (menu_item_id, current_price, recommended_price, suggested_price, profit_change_percentage, confidence_score, algorithm_used, recommendation_reason)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [item.menu_item_id, currentPrice, recommendedPrice, suggestedPrice, profitChangePct, confidence, algName, recommendationReason]);
            }
        }

        await client.query('COMMIT');
        console.log(`Generated price updates for ${generated.length} items.`);
        return generated;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generating price recommendations:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { generatePriceRecommendations };
