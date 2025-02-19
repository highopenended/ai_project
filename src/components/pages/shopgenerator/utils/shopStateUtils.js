/**
 * Creates a complete snapshot of the current shop state
 * @param {Object} shopDetails - Current shop details state
 * @param {Object} shopState - Current shop state (parameters, filters, etc)
 * @param {Object} filters - Current filter state (categories, subcategories, traits)
 * @param {Array} items - Current inventory items
 * @returns {Object} A complete snapshot of the shop state
 */
export const takeShopSnapshot = (shopDetails, shopState, filters, items) => {
    return {
        // Basic shop information
        id: shopDetails.id,
        name: shopDetails.name,
        keeperName: shopDetails.keeperName,
        type: shopDetails.type,
        location: shopDetails.location,
        description: shopDetails.description,
        keeperDescription: shopDetails.keeperDescription,
        dateCreated: shopDetails.dateCreated,
        dateLastEdited: shopDetails.dateLastEdited,

        // Shop generation settings
        gold: shopState.gold,
        levelRange: {
            min: shopState.levelRange.min,
            max: shopState.levelRange.max
        },
        itemBias: { ...shopState.itemBias },
        rarityDistribution: { ...shopState.rarityDistribution },

        // Filter states (create new Maps with copied entries)
        filters: {
            categories: new Map(filters?.categories || []),
            subcategories: new Map(filters?.subcategories || []),
            traits: new Map(filters?.traits || [])
        },

        // Current inventory with clean copies of arrays
        currentStock: items.map(item => ({
            ...item,
            traits: Array.isArray(item.traits) ? [...item.traits] : [],
            categories: Array.isArray(item.categories) ? [...item.categories] : [],
            subcategories: Array.isArray(item.subcategories) ? [...item.subcategories] : []
        }))
    };
};

/**
 * Helper function to compare two Maps
 * @param {Map} map1 
 * @param {Map} map2 
 */
const areMapsEqual = (map1, map2) => {
    // Handle undefined/null cases
    if (!map1 && !map2) return true;
    if (!map1 || !map2) return false;
    
    if (map1.size !== map2.size) return false;
    for (const [key, val1] of map1) {
        const val2 = map2.get(key);
        if (val2 !== val1) return false;
    }
    return true;
};

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
    const currentFilters = currentState.filters || {};
    const originalFilters = originalState.filters || {};
    
    if (!areMapsEqual(currentFilters.categories, originalFilters.categories) ||
        !areMapsEqual(currentFilters.subcategories, originalFilters.subcategories) ||
        !areMapsEqual(currentFilters.traits, originalFilters.traits)) {
        changes.parameters.filters = {
            old: {
                categories: new Map(originalFilters.categories || []),
                subcategories: new Map(originalFilters.subcategories || []),
                traits: new Map(originalFilters.traits || [])
            },
            new: {
                categories: new Map(currentFilters.categories || []),
                subcategories: new Map(currentFilters.subcategories || []),
                traits: new Map(currentFilters.traits || [])
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