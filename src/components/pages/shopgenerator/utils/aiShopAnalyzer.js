/**
 * AI Shop Analyzer
 * 
 * This module provides functions for analyzing shop data against reference values
 * to provide context for the AI about the shop's characteristics.
 */

import { LEVEL_MARKERS, NORMAL_RARITY_DISTRIBUTION, NORMAL_GOLD_PER_LEVEL } from './aiConstants';

/**
 * Analyzes shop data against reference values
 * 
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Formatted shop analysis text
 */
export const analyzeShopData = (shopSnapshot) => {
  return `Gold Analysis: ${analyzeShopGold(shopSnapshot.gold, shopSnapshot.levelRange)}
Level Analysis: ${analyzeShopLevel(shopSnapshot.levelRange)}
Rarity Analysis: ${analyzeRarityDistribution(shopSnapshot.rarityDistribution)}
Item Bias Analysis: ${analyzeItemBias(shopSnapshot.itemBias)}
Filter Analysis: ${analyzeFilterSelections(shopSnapshot.filterSelections, shopSnapshot.availableFilters)}`;
};

/**
 * Analyzes shop gold against expected values for level range
 * 
 * @param {number} gold - Shop gold amount
 * @param {Object} levelRange - Shop level range
 * @returns {string} Gold analysis text
 */
export const analyzeShopGold = (gold, levelRange) => {
  if (!gold || gold <= 0) return "No gold specified.";
  if (!levelRange) return "Gold amount is set, but no level range specified.";
  
  const avgLevel = (levelRange.min + levelRange.max) / 2;
  const expectedGold = avgLevel > 0 && avgLevel <= NORMAL_GOLD_PER_LEVEL.length 
    ? NORMAL_GOLD_PER_LEVEL[Math.floor(avgLevel) - 1] 
    : 1000;
  
  const ratio = gold / expectedGold;
  
  if (ratio > 1.5) return `This shop is very wealthy (${Math.round(ratio * 100)}% of normal) for its level range.`;
  if (ratio > 1.2) return `This shop is somewhat wealthy (${Math.round(ratio * 100)}% of normal) for its level range.`;
  if (ratio >= 0.8) return `This shop has a typical amount of gold for its level range.`;
  if (ratio >= 0.5) return `This shop is somewhat poor (${Math.round(ratio * 100)}% of normal) for its level range.`;
  return `This shop is very poor (${Math.round(ratio * 100)}% of normal) for its level range.`;
};

/**
 * Analyzes shop level range
 * 
 * @param {Object} levelRange - Shop level range
 * @returns {string} Level range analysis text
 */
export const analyzeShopLevel = (levelRange) => {
  if (!levelRange) return "No level range specified.";
  
  const { min, max } = levelRange;
  
  // Find the appropriate level markers
  let minCategory = "Unknown";
  let maxCategory = "Unknown";
  
  for (let i = LEVEL_MARKERS.length - 1; i >= 0; i--) {
    if (min >= LEVEL_MARKERS[i].threshold) {
      minCategory = LEVEL_MARKERS[i].label;
      break;
    }
  }
  
  for (let i = LEVEL_MARKERS.length - 1; i >= 0; i--) {
    if (max >= LEVEL_MARKERS[i].threshold) {
      maxCategory = LEVEL_MARKERS[i].label;
      break;
    }
  }
  
  const range = max - min;
  let rangeDescription = "very narrow";
  if (range >= 15) rangeDescription = "extremely wide";
  else if (range >= 10) rangeDescription = "very wide";
  else if (range >= 5) rangeDescription = "wide";
  else if (range >= 3) rangeDescription = "moderate";
  
  return `This shop caters to ${minCategory} to ${maxCategory} adventurers with a ${rangeDescription} level range.`;
};

/**
 * Analyzes rarity distribution against normal distribution
 * 
 * @param {Object} distribution - Rarity distribution object
 * @returns {string} Rarity distribution analysis text
 */
export const analyzeRarityDistribution = (distribution) => {
  if (!distribution) return "Using default rarity distribution.";
  
  const { Common, Uncommon, Rare, Unique } = distribution;
  const normal = NORMAL_RARITY_DISTRIBUTION;
  
  const commonDiff = Common - normal.Common;
  const uncommonDiff = Uncommon - normal.Uncommon;
  const rareDiff = Rare - normal.Rare;
  const uniqueDiff = Unique - normal.Unique;
  
  let analysis = [];
  
  if (Math.abs(commonDiff) > 5) {
    analysis.push(commonDiff > 0 
      ? `Higher than normal common items (+${commonDiff.toFixed(1)}%)`
      : `Lower than normal common items (${commonDiff.toFixed(1)}%)`);
  }
  
  if (Math.abs(uncommonDiff) > 1) {
    analysis.push(uncommonDiff > 0 
      ? `Higher than normal uncommon items (+${uncommonDiff.toFixed(1)}%)`
      : `Lower than normal uncommon items (${uncommonDiff.toFixed(1)}%)`);
  }
  
  if (Math.abs(rareDiff) > 0.1) {
    analysis.push(rareDiff > 0 
      ? `Higher than normal rare items (+${rareDiff.toFixed(2)}%)`
      : `Lower than normal rare items (${rareDiff.toFixed(2)}%)`);
  }
  
  if (Math.abs(uniqueDiff) > 0.01) {
    analysis.push(uniqueDiff > 0 
      ? `Higher than normal unique items (+${uniqueDiff.toFixed(3)}%)`
      : `Lower than normal unique items (${uniqueDiff.toFixed(3)}%)`);
  }
  
  return analysis.length > 0 
    ? analysis.join(". ") + "."
    : "This shop has a typical rarity distribution.";
};

/**
 * Analyzes item bias settings
 * 
 * @param {Object} itemBias - Item bias object
 * @returns {string} Item bias analysis text
 */
export const analyzeItemBias = (itemBias) => {
  if (!itemBias) return "Using default item bias.";
  
  const { x, y } = itemBias;
  const xPercent = Math.round(x * 100);
  const yPercent = Math.round(y * 100);
  
  let varietyDesc = "balanced";
  if (xPercent > 75) varietyDesc = "extremely varied";
  else if (xPercent > 60) varietyDesc = "highly varied";
  else if (xPercent > 40) varietyDesc = "balanced";
  else if (xPercent > 25) varietyDesc = "somewhat specialized";
  else varietyDesc = "highly specialized";
  
  let costDesc = "average-priced";
  if (yPercent > 75) costDesc = "premium-priced";
  else if (yPercent > 60) costDesc = "high-priced";
  else if (yPercent > 40) costDesc = "average-priced";
  else if (yPercent > 25) costDesc = "budget-priced";
  else costDesc = "discount-priced";
  
  return `This shop has a ${varietyDesc} inventory with ${costDesc} items.`;
};

/**
 * Analyzes filter selections against available options
 * 
 * @param {Object} filterSelections - Filter selections object
 * @param {Object} availableFilters - Available filter options
 * @returns {string} Filter selections analysis text
 */
export const analyzeFilterSelections = (filterSelections, availableFilters = {}) => {
  if (!filterSelections) return "No filter selections specified.";
  
  const analysis = [];
  
  // Analyze categories
  if (filterSelections.categories?.included?.length > 0 || filterSelections.categories?.excluded?.length > 0) {
    const includedCount = filterSelections.categories?.included?.length || 0;
    const excludedCount = filterSelections.categories?.excluded?.length || 0;
    const totalAvailable = availableFilters?.categories?.length || 0;
    
    if (includedCount > 0 && totalAvailable > 0) {
      const percentage = Math.round((includedCount / totalAvailable) * 100);
      analysis.push(`Shop focuses on ${includedCount} specific categories (${percentage}% of available categories)`);
    }
    
    if (excludedCount > 0 && totalAvailable > 0) {
      const percentage = Math.round((excludedCount / totalAvailable) * 100);
      analysis.push(`Shop excludes ${excludedCount} categories (${percentage}% of available categories)`);
    }
  }
  
  // Analyze subcategories
  if (filterSelections.subcategories?.included?.length > 0 || filterSelections.subcategories?.excluded?.length > 0) {
    const includedCount = filterSelections.subcategories?.included?.length || 0;
    const excludedCount = filterSelections.subcategories?.excluded?.length || 0;
    
    if (includedCount > 0) {
      analysis.push(`Shop specializes in ${includedCount} specific subcategories`);
    }
    
    if (excludedCount > 0) {
      analysis.push(`Shop excludes ${excludedCount} subcategories`);
    }
  }
  
  // Analyze traits
  if (filterSelections.traits?.included?.length > 0 || filterSelections.traits?.excluded?.length > 0) {
    const includedCount = filterSelections.traits?.included?.length || 0;
    const excludedCount = filterSelections.traits?.excluded?.length || 0;
    
    if (includedCount > 0) {
      analysis.push(`Shop focuses on items with ${includedCount} specific traits`);
    }
    
    if (excludedCount > 0) {
      analysis.push(`Shop avoids items with ${excludedCount} specific traits`);
    }
  }
  
  return analysis.length > 0 
    ? analysis.join(". ") + "."
    : "No specific filter selections applied.";
}; 