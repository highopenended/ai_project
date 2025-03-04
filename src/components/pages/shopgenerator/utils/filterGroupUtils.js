/**
 * Filter Group Utilities
 * 
 * This module provides shared utilities for filter components including
 * category, subcategory, and trait filters. It centralizes filter-related
 * logic to maintain DRY code principles.
 */

/**
 * Extracts unique categories and subcategories from a list of items.
 * @param {Array} items - Array of items with item_category and item_subcategory properties
 * @returns {Object} Object containing categories and subcategory counts
 */
export function extractUniqueCategories(items) {
    const categoriesMap = new Map();
    const subcategoryCounts = new Map();

    items.forEach(item => {
        const category = item.item_category || 'Other';
        const subcategory = item.item_subcategory || 'Other';

        if (!categoriesMap.has(category)) {
            categoriesMap.set(category, new Set());
        }
        categoriesMap.get(category).add(subcategory);

        subcategoryCounts.set(subcategory, (subcategoryCounts.get(subcategory) || 0) + 1);
    });

    const result = {
        categories: {},
        subcategoryCounts: Object.fromEntries(subcategoryCounts)
    };

    categoriesMap.forEach((subcategories, category) => {
        result.categories[category] = {
            subcategories: Array.from(subcategories).sort(),
            count: items.filter(item => item.item_category === category).length
        };
    });

    return result;
}

/**
 * Extracts available filter options for AI prompts
 * @param {Object} categoryData - Category data from extractUniqueCategories
 * @param {Array} traitList - List of traits from trait-list.json
 * @returns {Object} Object containing available categories, subcategories, and traits
 */
export function extractAvailableFilterOptions(categoryData, traitList) {
    if (!categoryData || !categoryData.categories) {
        return {
            categories: [],
            subcategories: [],
            traits: []
        };
    }

    // Extract categories
    const categories = Object.keys(categoryData.categories).sort();

    // Extract all subcategories
    const subcategories = new Set();
    Object.values(categoryData.categories).forEach(category => {
        category.subcategories.forEach(subcategory => {
            subcategories.add(subcategory);
        });
    });

    // Extract traits
    const traits = traitList ? traitList.map(trait => trait.Trait).sort() : [];

    return {
        categories,
        subcategories: Array.from(subcategories).sort(),
        traits
    };
}

/**
 * Gets filtered categories based on search term
 * @param {Object} categoryData - Category data object
 * @param {string} searchTerm - Search term to filter categories
 * @returns {Array} Array of filtered category objects
 */
export function getFilteredCategories(categoryData, searchTerm = "") {
    if (!categoryData || !categoryData.categories) return [];
    
    return Object.entries(categoryData.categories)
        .filter(([category]) =>
            category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category]) => ({
            name: category
        }));
}

/**
 * Gets filtered subcategories based on search term and selected categories
 * @param {Object} categoryData - Category data object
 * @param {Map} categoryStates - Map of category selection states
 * @param {string} searchTerm - Search term to filter subcategories
 * @param {string} includeState - The state value that indicates inclusion
 * @returns {Array} Array of filtered subcategory objects
 */
export function getFilteredSubcategories(categoryData, categoryStates, searchTerm = "", includeState) {
    if (!categoryData || !categoryData.categories) return [];
    
    // Get all subcategories - either from selected categories or all categories if none selected
    const subcategories = new Set();
    const hasSelectedCategories = Array.from(categoryStates.values()).some(state => state === includeState);
    
    Object.entries(categoryData.categories).forEach(([category, data]) => {
        if (!hasSelectedCategories || categoryStates.get(category) === includeState) {
            data.subcategories.forEach((subcategory) => subcategories.add(subcategory));
        }
    });

    return Array.from(subcategories)
        .filter(subcategory =>
            subcategory.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.localeCompare(b))
        .map(subcategory => ({
            name: subcategory
        }));
}

/**
 * Gets filtered traits based on search term
 * @param {Array} traitList - List of traits
 * @param {string} searchTerm - Search term to filter traits
 * @returns {Array} Array of filtered trait objects
 */
export function getFilteredTraits(traitList, searchTerm = "") {
    if (!traitList) return [];
    
    return traitList
        .filter(({ Trait }) =>
            Trait.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.Trait.localeCompare(b.Trait))
        .map(({ Trait }) => ({
            name: Trait
        }));
} 