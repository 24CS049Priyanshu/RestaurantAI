const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/auth');

const { generateComboRules } = require('../services/ai/comboRecommender');
const { generatePriceRecommendations } = require('../services/ai/priceOptimizer');
const { classifyMenuItems } = require('../services/ai/menuClassifier');

/**
 * POST /api/ai/trigger
 * Manually trigger all AI background calculations for a specific restaurant.
 * Typically this would be a CRON job, but here we expose an endpoint for the hackathon UI.
 */
router.post('/trigger', verifyToken, verifyRole(['admin', 'restaurant_manager']), async (req, res) => {
    try {
        const { restaurantId } = req.user;

        console.log(`[AI Engine] Manually triggered by user for restaurant ${restaurantId}`);

        // Run calculations sequentially or in parallel
        const [combos, prices, classes] = await Promise.all([
            generateComboRules(restaurantId),
            generatePriceRecommendations(restaurantId),
            classifyMenuItems(restaurantId)
        ]);

        res.json({
            success: true,
            message: 'AI algorithms executed successfully.',
            insights: {
                combosGenerated: combos.length,
                pricesOptimized: prices.length,
                itemsClassified: classes.length
            }
        });
    } catch (error) {
        console.error('[AI Engine] Error triggering AI calculations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute AI logic.',
            details: error.message
        });
    }
});

module.exports = router;
