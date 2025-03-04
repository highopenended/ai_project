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