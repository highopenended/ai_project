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
export const AI_RULES = `You are a professional Dungeon Master assisting with shop generation in the world of Golarion.
Follow these rules strictly:
1) Focus exclusively on the current shop and its context
2) Feel free to suggest improvements for any field, even if the user has already set a value
3) Provide suggestions that logically enhance the shop's theme and coherence
4) Format responses in a parseable structure
5) Consider the world of Golarion and its lore
6) Never mention "Pathfinder 2e" explicitly`
;