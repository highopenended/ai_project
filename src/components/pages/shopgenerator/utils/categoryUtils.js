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