/**
 * Creates a complete snapshot of the current shop state
 * @param {Object} shopState - Current shop state (parameters, filters, etc)
 * @param {Object} filterMaps - Current filter state (categories, subcategories, traits)
 * @param {Array} items - Current inventory items
 * @returns {Object} A complete snapshot of the shop state
 */
export const takeShopSnapshot = (shopState, filterMaps, items) => ({
    // Shop details
    id: shopState.id,
    name: shopState.name,
    keeperName: shopState.keeperName,
    type: shopState.type,
    location: shopState.location,
    description: shopState.description,
    keeperDescription: shopState.keeperDescription,
    dateCreated: shopState.dateCreated,
    dateLastEdited: shopState.dateLastEdited,
    // Shop parameters
    gold: shopState.gold,
    levelRange: shopState.levelRange,
    itemBias: shopState.itemBias,
    rarityDistribution: shopState.rarityDistribution,
    // Filters and inventory - store as plain objects for Firebase compatibility
    filterStorageObjects: {
        categories: Object.fromEntries(filterMaps.categories.entries()),
        subcategories: Object.fromEntries(filterMaps.subcategories.entries()),
        traits: Object.fromEntries(filterMaps.traits.entries()),
    },
    currentStock: [...items],
});

/**
 * Compares two shop states and returns the differences
 * @param {Object} currentState - Current shop state
 * @param {Object} originalState - Original shop state to compare against
 * @returns {Object} Object containing all differences found
 */
export const compareShopStates = (currentState, originalState) => {
    const changes = {
        basic: {},
        parameters: {},
        hasInventoryChanged: false
    };

    // Check basic fields
    if (currentState.name !== originalState.name)
        changes.basic.name = { old: originalState.name, new: currentState.name };
    if (currentState.keeperName !== originalState.keeperName)
        changes.basic.keeperName = { old: originalState.keeperName, new: currentState.keeperName };
    if (currentState.type !== originalState.type)
        changes.basic.type = { old: originalState.type, new: currentState.type };
    if (currentState.location !== originalState.location)
        changes.basic.location = { old: originalState.location, new: currentState.location };
    if (currentState.description !== originalState.description)
        changes.basic.description = { old: originalState.description, new: currentState.description };
    if (currentState.keeperDescription !== originalState.keeperDescription)
        changes.basic.keeperDescription = { old: originalState.keeperDescription, new: currentState.keeperDescription };

    // Check parameters
    if (currentState.gold !== originalState.gold)
        changes.parameters.gold = { old: originalState.gold, new: currentState.gold };
    if (currentState.levelRange.min !== originalState.levelRange.min)
        changes.parameters.levelMin = { old: originalState.levelRange.min, new: currentState.levelRange.min };
    if (currentState.levelRange.max !== originalState.levelRange.max)
        changes.parameters.levelMax = { old: originalState.levelRange.max, new: currentState.levelRange.max };

    // Check itemBias
    if (
        currentState.itemBias?.x !== originalState.itemBias?.x ||
        currentState.itemBias?.y !== originalState.itemBias?.y
    ) {
        changes.parameters.itemBias = {
            old: { ...originalState.itemBias },
            new: { ...currentState.itemBias }
        };
    }

    // Check rarityDistribution
    const currentRarityKeys = Object.keys(currentState.rarityDistribution || {});
    const originalRarityKeys = Object.keys(originalState.rarityDistribution || {});
    if (
        currentRarityKeys.length !== originalRarityKeys.length ||
        currentRarityKeys.some(key => 
            currentState.rarityDistribution[key] !== originalState.rarityDistribution[key]
        )
    ) {
        changes.parameters.rarityDistribution = {
            old: { ...originalState.rarityDistribution },
            new: { ...currentState.rarityDistribution }
        };
    }

    // Check filters
    const currentFilterMaps = currentState.filterMaps || {};
    const originalFilterMaps = originalState.filterStorageObjects || {};
    
    const areFiltersEqual = (map1, map2) => {
        if (!map1 || !map2) return false;
        if (map1.size !== map2.size) return false;
        for (const [key, value] of map1) {
            if (map2.get(key) !== value) return false;
        }
        return true;
    };

    if (!areFiltersEqual(currentFilterMaps.categories, new Map(Object.entries(originalFilterMaps.categories || {}))) ||
        !areFiltersEqual(currentFilterMaps.subcategories, new Map(Object.entries(originalFilterMaps.subcategories || {}))) ||
        !areFiltersEqual(currentFilterMaps.traits, new Map(Object.entries(originalFilterMaps.traits || {})))) {
        changes.parameters.filters = {
            old: {
                categories: { ...(originalFilterMaps.categories || {}) },
                subcategories: { ...(originalFilterMaps.subcategories || {}) },
                traits: { ...(originalFilterMaps.traits || {}) }
            },
            new: {
                categories: Object.fromEntries(currentFilterMaps.categories || new Map()),
                subcategories: Object.fromEntries(currentFilterMaps.subcategories || new Map()),
                traits: Object.fromEntries(currentFilterMaps.traits || new Map())
            }
        };
    }

    // Check if inventory has changed
    const currentStock = currentState.currentStock || [];
    const originalStock = originalState.currentStock || [];
    changes.hasInventoryChanged = currentStock.length !== originalStock.length;

    return changes;
};

/**
 * Checks if there are any changes between current and original states
 * @param {Object} changes - Result from compareShopStates
 * @returns {boolean} True if there are any changes
 */
export const hasChanges = (changes) => {
    return Object.keys(changes.basic).length > 0 || 
           Object.keys(changes.parameters).length > 0 || 
           changes.hasInventoryChanged;
}; 