/**
 * AI Tuning Parameters and Constants
 * 
 * This file contains configuration values and constants used by the AI assistant
 * to make informed decisions about shop generation and provide appropriate suggestions.
 */

/**
 * Level threshold markers for categorizing shop levels
 * Each entry defines a level category and its minimum threshold
 */
export const LEVEL_MARKERS = [
    { label: 'Very Low Level', threshold: 0 },
    { label: 'Low Level', threshold: 5 },
    { label: 'Medium Level', threshold: 10 },
    { label: 'High Level', threshold: 15 },
    { label: 'Very High Level', threshold: 20 }
];

/**
 * Standard distribution of item rarities in a typical shop
 * Used as a baseline for comparing user-selected distributions
 */
export const NORMAL_RARITY_DISTRIBUTION = {
    Common: 95,
    Uncommon: 4.5,
    Rare: 0.49,
    Unique: 0.01
};

/**
 * Expected gold amount for shops at each level
 * Index + 1 represents the level, value represents the gold amount
 */
export const NORMAL_GOLD_PER_LEVEL = Array(20).fill(0)
    .map((_, i) => (i + 1) * 1000);

/**
 * AI prompt templates for different operations
 */
export const AI_PROMPTS = {
    baseContext: `You are a professional Dungeon Master assisting with shop generation in the world of Golarion.
Follow these rules strictly:
1) Focus exclusively on the current shop and its context
2) Consider all previous conversation history for this shop
3) Respect user-selected values as absolute truth
4) Provide suggestions that logically complement existing values
5) Format responses in a parseable structure
6) Consider the world of Golarion and its lore
7) Never mention "Pathfinder 2e" explicitly`,

    fillGapsTemplate: `Based on the following user-selected values:
{userValues}

And considering our previous conversation:
{conversationHistory}

Please suggest logical values for the unselected fields. Format your response exactly as follows:
{
    "reasoning": "Brief explanation of your choices...",
    "suggestions": {
        "shopName": "string or null if user-selected",
        "shopType": "string or null if user-selected",
        "keeperName": "string or null if user-selected",
        "location": "string or null if user-selected",
        "description": "string or null if user-selected",
        "keeperDescription": "string or null if user-selected",
        "parameters": {
            "gold": "number or null if user-selected",
            "levelRange": {
                "min": "number or null if user-selected",
                "max": "number or null if user-selected"
            },
            "itemBias": {
                "x": "number or null if user-selected",
                "y": "number or null if user-selected"
            },
            "rarityDistribution": {
                "Common": "number or null if user-selected",
                "Uncommon": "number or null if user-selected",
                "Rare": "number or null if user-selected",
                "Unique": "number or null if user-selected"
            }
        },
        "categories": {
            "included": ["array of category names or null if user-selected"],
            "excluded": ["array of category names or null if user-selected"]
        }
    }
}`
};

/**
 * Default field values used to determine if a value has been intentionally set by the user
 */
export const DEFAULT_FIELD_VALUES = {
    shopName: "Unnamed Shop",
    keeperName: "Unknown",
    type: "General Store",
    location: "Unknown Location",
    description: "No details available",
    keeperDescription: "No details available",
    itemBias: { x: 0.5, y: 0.5 },
    rarityDistribution: NORMAL_RARITY_DISTRIBUTION
}; 