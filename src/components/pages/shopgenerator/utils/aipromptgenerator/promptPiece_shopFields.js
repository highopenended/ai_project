/**
 * AI Field Formatter
 * 
 * This module provides specialized formatting for shop fields to ensure
 * they are presented in a consistent, readable format for AI prompts.
 */

/**
 * Formats all shop fields in a consistent, readable format
 * 
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Formatted shop fields text
 */
export const getPiece_shopFields = (shopSnapshot) => {
  return `Shop Details:
- Name: "${shopSnapshot.name || ''}"
- Type: "${shopSnapshot.type || ''}"
- Keeper: "${shopSnapshot.keeperName || ''}"
- Location: "${shopSnapshot.location || ''}"
- Description: "${shopSnapshot.description || ''}"
- Keeper Description: "${shopSnapshot.keeperDescription || ''}"

Shop Parameters:
- Gold: ${shopSnapshot.gold || 0}
- Level Range: ${shopSnapshot.levelRange?.min || 0}-${shopSnapshot.levelRange?.max || 0}
- Item Bias: ${formatItemBias(shopSnapshot.itemBias)}
- Rarity Distribution: ${formatRarityDistribution(shopSnapshot.rarityDistribution)}

${formatFilterSelections(shopSnapshot.filterSelections, shopSnapshot.availableFilters)}`;
};

/**
 * Formats item bias in a human-readable format
 * 
 * @param {Object} itemBias - Item bias object with x and y properties
 * @returns {string} Formatted item bias text
 */
export const formatItemBias = (itemBias) => {
  const x = itemBias?.x !== undefined ? itemBias.x : 0.5;
  const y = itemBias?.y !== undefined ? itemBias.y : 0.5;
  
  return `Variety: ${Math.round(x * 100)}%, Cost: ${Math.round(y * 100)}%`;
};

/**
 * Formats rarity distribution in a human-readable format
 * 
 * @param {Object} distribution - Rarity distribution object
 * @returns {string} Formatted rarity distribution text
 */
export const formatRarityDistribution = (distribution) => {
  if (!distribution) return "Default distribution";
  
  const common = distribution.Common !== undefined ? distribution.Common : 95;
  const uncommon = distribution.Uncommon !== undefined ? distribution.Uncommon : 4.5;
  const rare = distribution.Rare !== undefined ? distribution.Rare : 0.49;
  const unique = distribution.Unique !== undefined ? distribution.Unique : 0.01;
  
  return `Common: ${common}%, Uncommon: ${uncommon}%, Rare: ${rare}%, Unique: ${unique}%`;
};

/**
 * Formats filter selections for AI prompt
 * 
 * @param {Object} filterSelections - Filter selections object
 * @param {Object} availableFilters - Available filter options
 * @returns {string} Formatted filter selections text
 */
export const formatFilterSelections = (filterSelections, availableFilters = {}) => {
  if (!filterSelections) return "";
  
  const formatList = (items) => (items && items.length > 0 ? items.join(", ") : "None");

  // Format available options if provided
  let availableOptionsText = "";
  if (availableFilters) {
    availableOptionsText = `
Available Filter Options:
- Categories: ${formatList(availableFilters.categories || [])}`;
  }

  return `Filter Selections:
- Categories:
  * Included: ${formatList(filterSelections?.categories?.included)}
  * Excluded: ${formatList(filterSelections?.categories?.excluded)}${availableOptionsText}`;
}; 