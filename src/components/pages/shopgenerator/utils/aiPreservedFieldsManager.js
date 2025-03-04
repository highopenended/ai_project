/**
 * AI Preserved Fields Manager
 * 
 * This module provides functions for handling preserved fields logic
 * for AI prompts, creating clear sections for preserved and non-preserved fields.
 */

import defaultShopData from './shopData';
import { formatItemBias } from './aiFieldFormatter';
import { formatRarityDistribution } from './aiFieldFormatter';

/**
 * Field definitions with labels and value formatters
 */
const FIELD_DEFINITIONS = {
  name: { 
    label: "Shop Name", 
    defaultValue: defaultShopData.name,
    getValue: (snapshot) => snapshot.name,
    formatValue: (value) => `"${value}"`
  },
  type: { 
    label: "Shop Type", 
    defaultValue: defaultShopData.type,
    getValue: (snapshot) => snapshot.type,
    formatValue: (value) => `"${value}"`
  },
  keeperName: { 
    label: "Keeper Name", 
    defaultValue: defaultShopData.keeperName,
    getValue: (snapshot) => snapshot.keeperName,
    formatValue: (value) => `"${value}"`
  },
  location: { 
    label: "Location", 
    defaultValue: defaultShopData.location,
    getValue: (snapshot) => snapshot.location,
    formatValue: (value) => `"${value}"`
  },
  description: { 
    label: "Shop Description", 
    defaultValue: defaultShopData.description,
    getValue: (snapshot) => snapshot.description,
    formatValue: (value) => `"${value}"`
  },
  keeperDescription: { 
    label: "Keeper Description", 
    defaultValue: defaultShopData.keeperDescription,
    getValue: (snapshot) => snapshot.keeperDescription,
    formatValue: (value) => `"${value}"`
  },
  gold: { 
    label: "Gold Amount", 
    defaultValue: defaultShopData.gold,
    getValue: (snapshot) => snapshot.gold,
    formatValue: (value) => `${value}`
  },
  levelRange: { 
    label: "Level Range", 
    defaultValue: defaultShopData.levelRange,
    getValue: (snapshot) => snapshot.levelRange,
    formatValue: (value) => `${value.min}-${value.max}`
  },
  itemBias: { 
    label: "Item Bias", 
    defaultValue: defaultShopData.itemBias,
    getValue: (snapshot) => snapshot.itemBias,
    formatValue: (value) => formatItemBias(value)
  },
  rarityDistribution: { 
    label: "Rarity Distribution", 
    defaultValue: defaultShopData.rarityDistribution,
    getValue: (snapshot) => snapshot.rarityDistribution,
    formatValue: (value) => formatRarityDistribution(value)
  },
  filterCategories: { 
    label: "Category Filters", 
    defaultValue: {},
    getValue: (snapshot) => snapshot.filterSelections?.categories,
    formatValue: (value, snapshot) => {
      if (!value) return "None";
      
      const included = value.included?.length ? `Included: ${value.included.join(", ")}` : "";
      const excluded = value.excluded?.length ? `Excluded: ${value.excluded.join(", ")}` : "";
      
      // Add available options if present
      let availableOptions = "";
      if (snapshot?.availableFilters?.categories?.length > 0) {
        availableOptions = `\n  * Available Options: ${snapshot.availableFilters.categories.join(", ")}`;
      }
      
      return [included, excluded].filter(Boolean).join("; ") + availableOptions || "None";
    }
  }
};

/**
 * Formats preserved fields for AI prompt
 * 
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Formatted preserved fields text
 */
export const formatPreservedFields = (preservedFields, shopSnapshot) => {
  if (!preservedFields) return "";
  
  const { preservedList, nonPreservedList } = categorizeFields(preservedFields, shopSnapshot);
  
  let result = "";
  
  if (preservedList.length > 0) {
    result += `
PRESERVED FIELDS (DO NOT CHANGE THESE):
${preservedList.map(field => `- ${field.label}: ${field.value}`).join('\n')}

These preserved fields should be treated as absolute truth and should not be modified in your suggestions.`;
  }
  
  if (nonPreservedList.length > 0) {
    result += `

FIELDS TO IMPROVE (PLEASE SUGGEST CHANGES FOR THESE):
${nonPreservedList.map(field => `- ${field.label}`).join('\n')}

Please focus your suggestions on improving these specific fields.`;
  }
  
  return result;
};

/**
 * Categorizes fields into preserved and non-preserved lists
 * 
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {Object} Object with preservedList and nonPreservedList arrays
 */
export const categorizeFields = (preservedFields, shopSnapshot) => {
  const preservedList = [];
  const nonPreservedList = [];
  
  // Process each field definition
  Object.entries(FIELD_DEFINITIONS).forEach(([fieldKey, fieldDef]) => {
    const isPreserved = preservedFields[fieldKey];
    const value = fieldDef.getValue(shopSnapshot);
    const formattedValue = fieldDef.formatValue ? fieldDef.formatValue(value, shopSnapshot) : value;
    
    if (isPreserved) {
      preservedList.push({
        key: fieldKey,
        label: fieldDef.label,
        value: formattedValue
      });
    } else {
      nonPreservedList.push({
        key: fieldKey,
        label: fieldDef.label
      });
    }
  });
  
  return { preservedList, nonPreservedList };
};

/**
 * Checks if a field has a non-default value
 * 
 * @param {string} fieldKey - Field key
 * @param {any} value - Field value
 * @returns {boolean} True if the value is different from the default
 */
export const isNonDefaultValue = (fieldKey, value) => {
  const fieldDef = FIELD_DEFINITIONS[fieldKey];
  if (!fieldDef) return false;
  
  const defaultValue = fieldDef.defaultValue;
  
  // Handle special cases
  if (fieldKey === 'levelRange') {
    return value?.min !== defaultValue.min || value?.max !== defaultValue.max;
  }
  
  if (fieldKey === 'itemBias') {
    return value?.x !== defaultValue.x || value?.y !== defaultValue.y;
  }
  
  if (fieldKey === 'rarityDistribution') {
    return value?.Common !== defaultValue.Common ||
           value?.Uncommon !== defaultValue.Uncommon ||
           value?.Rare !== defaultValue.Rare ||
           value?.Unique !== defaultValue.Unique;
  }
  
  // Handle filter fields
  if (fieldKey.startsWith('filter')) {
    // Consider non-default if there are any included or excluded items
    return value?.included?.length > 0 || value?.excluded?.length > 0;
  }
  
  // Default comparison
  return value !== defaultValue;
};