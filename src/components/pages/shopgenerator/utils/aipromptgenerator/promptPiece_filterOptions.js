/**
 * AI Filter Options
 *
 * This module provides functions for analyzing shop data against reference values
 * to provide context for the AI about the shop's characteristics.
 */

/**
 * Generates text explaining filter constraints
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Filter constraints text
 */
export const getPiece_filterContraints = (shopSnapshot) => {
    if (!shopSnapshot.availableFilters) return "";

    return `IMPORTANT FILTER CONSTRAINTS:
When suggesting changes to category filters, you MUST ONLY suggest options from the available categories list provided above. Do not suggest any categories that are not in this list.

If the user asks about adding specific categories, verify they exist in the available options before suggesting them. If they don't exist in the available options, politely inform the user that those options are not available and suggest alternatives from the valid list.`;
};