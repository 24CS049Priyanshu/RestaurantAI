/**
 * Simple NLP parser to map voice transcripts to menu items and quantities.
 * In a real-world app, this would use a robust LLM or NLP service like Dialogflow.
 */

// Basic dictionary to map spoken numbers to integers
const textToNumber = {
    'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

// Simplified parser
async function parseCommand(transcription, menuItemsDb) {
    const text = transcription.toLowerCase();

    // Default intent is ordering
    const result = {
        intent: 'add_to_order',
        items: [],
        rawText: transcription,
        confidence: 0.85
    };

    // If text contains "cancel", "stop", or "no" alone it might be a cancellation
    if (text.includes('cancel my order') || text.includes('stop recording')) {
        result.intent = 'cancel_order';
        return result;
    }

    // Try finding each menu item in the text
    menuItemsDb.forEach(item => {
        const itemNameRaw = item.item_name.toLowerCase();

        // Use a simple regex to detect word boundaries around the item name
        // Also look for numbers preceding the item (e.g., "two burgers")
        const regex = new RegExp(`(?:(\\w+)\\s+)?${itemNameRaw}`, 'gi');

        let match;
        while ((match = regex.exec(text)) !== null) {
            let quantity = 1; // default to 1
            if (match[1]) {
                const prefix = match[1].toLowerCase();
                // Check if the preceding word is a number
                if (textToNumber[prefix]) {
                    quantity = textToNumber[prefix];
                } else if (!isNaN(parseInt(prefix))) {
                    quantity = parseInt(prefix);
                }
            }

            // Check if we already detected this item
            const existing = result.items.find(i => i.menu_item_id === item.id);
            if (existing) {
                existing.quantity += quantity;
            } else {
                result.items.push({
                    menu_item_id: item.id,
                    name: item.item_name,
                    quantity: quantity,
                    price: item.price
                });
            }
        }
    });

    if (result.items.length === 0) {
        result.intent = 'unknown';
        result.confidence = 0.4;
    }

    return result;
}

module.exports = { parseCommand };
