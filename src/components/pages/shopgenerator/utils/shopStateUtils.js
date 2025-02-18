import { SELECTION_STATES } from "./shopGeneratorConstants";

/**
 * Creates a complete snapshot of the current shop state
 * @param {Object} shopDetails - Current shop details state
 * @param {Object} shopState - Current shop state (parameters, filters, etc)
 * @param {Array} items - Current inventory items
 * @returns {Object} A complete snapshot of the shop state
 */
export const takeShopSnapshot = (shopDetails, shopState, items) => {
    return {
        id: shopDetails.id,
        shortData: {
            shopName: shopDetails.name,
            shopKeeperName: shopDetails.keeperName,
            type: shopDetails.type,
            location: shopDetails.location,
        },
        longData: {
            shopDetails: shopDetails.description,
            shopKeeperDetails: shopDetails.keeperDescription,
        },
        parameters: {
            goldAmount: shopState.gold,
            levelLow: shopState.levelRange.min,
            levelHigh: shopState.levelRange.max,
            shopBias: { ...shopState.itemBias },
            rarityDistribution: { ...shopState.rarityDistribution },
            categories: {
                included: Array.from(shopState.filters.categories.entries())
                    .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                    .map(([item]) => item),
                excluded: Array.from(shopState.filters.categories.entries())
                    .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                    .map(([item]) => item),
            },
            subcategories: {
                included: Array.from(shopState.filters.subcategories.entries())
                    .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                    .map(([item]) => item),
                excluded: Array.from(shopState.filters.subcategories.entries())
                    .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                    .map(([item]) => item),
            },
            traits: {
                included: Array.from(shopState.filters.traits.entries())
                    .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                    .map(([item]) => item),
                excluded: Array.from(shopState.filters.traits.entries())
                    .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                    .map(([item]) => item),
            },
        },
        filterStates: {
            categories: Object.fromEntries(shopState.filters.categories),
            subcategories: Object.fromEntries(shopState.filters.subcategories),
            traits: Object.fromEntries(shopState.filters.traits),
        },
        currentStock: items.map(item => ({
            ...item,
            traits: Array.isArray(item.traits) ? [...item.traits] : [],
            categories: Array.isArray(item.categories) ? [...item.categories] : [],
            subcategories: Array.isArray(item.subcategories) ? [...item.subcategories] : [],
        })),
        dateCreated: shopDetails.dateCreated,
        dateLastEdited: shopDetails.dateLastEdited,
    };
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
    if (currentState.shortData.shopName !== originalState.shortData.shopName)
        changes.basic.shopName = { old: originalState.shortData.shopName, new: currentState.shortData.shopName };
    if (currentState.shortData.shopKeeperName !== originalState.shortData.shopKeeperName)
        changes.basic.shopKeeperName = { old: originalState.shortData.shopKeeperName, new: currentState.shortData.shopKeeperName };
    if (currentState.shortData.type !== originalState.shortData.type)
        changes.basic.shopType = { old: originalState.shortData.type, new: currentState.shortData.type };
    if (currentState.shortData.location !== originalState.shortData.location)
        changes.basic.shopLocation = { old: originalState.shortData.location, new: currentState.shortData.location };
    if (currentState.longData.shopDetails !== originalState.longData.shopDetails)
        changes.basic.shopDetails = { old: originalState.longData.shopDetails, new: currentState.longData.shopDetails };
    if (currentState.longData.shopKeeperDetails !== originalState.longData.shopKeeperDetails)
        changes.basic.shopKeeperDetails = { old: originalState.longData.shopKeeperDetails, new: currentState.longData.shopKeeperDetails };

    // Check parameters
    if (currentState.parameters.goldAmount !== originalState.parameters.goldAmount)
        changes.parameters.currentGold = { old: originalState.parameters.goldAmount, new: currentState.parameters.goldAmount };
    if (currentState.parameters.levelLow !== originalState.parameters.levelLow)
        changes.parameters.lowestLevel = { old: originalState.parameters.levelLow, new: currentState.parameters.levelLow };
    if (currentState.parameters.levelHigh !== originalState.parameters.levelHigh)
        changes.parameters.highestLevel = { old: originalState.parameters.levelHigh, new: currentState.parameters.levelHigh };

    // Check itemBias
    if (
        currentState.parameters.shopBias.x !== originalState.parameters.shopBias.x ||
        currentState.parameters.shopBias.y !== originalState.parameters.shopBias.y
    ) {
        changes.parameters.itemBias = {
            old: originalState.parameters.shopBias,
            new: currentState.parameters.shopBias,
        };
    }

    // Check rarity distribution
    const hasRarityChanged = Object.keys(currentState.parameters.rarityDistribution).some(
        (key) => currentState.parameters.rarityDistribution[key] !== originalState.parameters.rarityDistribution[key]
    );
    if (hasRarityChanged) {
        changes.parameters.rarityDistribution = {
            old: originalState.parameters.rarityDistribution,
            new: currentState.parameters.rarityDistribution,
        };
    }

    // Check filter states
    const hasFilterChanges = JSON.stringify(currentState.filterStates) !== JSON.stringify(originalState.filterStates);
    if (hasFilterChanges) {
        changes.parameters.filters = {
            old: originalState.filterStates,
            new: currentState.filterStates,
        };
    }

    // Check inventory
    // First check if lengths are different
    if (currentState.currentStock.length !== originalState.currentStock.length) {
        changes.hasInventoryChanged = true;
    } else {
        // If lengths are same, do a deep comparison of items
        const currentInventoryString = JSON.stringify(currentState.currentStock);
        const originalInventoryString = JSON.stringify(originalState.currentStock);
        changes.hasInventoryChanged = currentInventoryString !== originalInventoryString;
    }

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