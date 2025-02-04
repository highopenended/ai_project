// Utility function to convert price strings to gold values
export const convertPriceToGold = (priceStr) => {
    if (!priceStr) return 0;
    const match = priceStr.match(/(\d+(?:\.\d+)?)\s*(cp|sp|gp|pp)/);
    if (!match) return 0;
    
    const [, value, unit] = match;
    const numValue = parseFloat(value);
    
    switch (unit) {
        case 'cp': return numValue / 100;
        case 'sp': return numValue / 10;
        case 'gp': return numValue;
        case 'pp': return numValue * 10;
        default: return 0;
    }
};

/**
 * Filter items based on level range
 * @param {Array} items - Array of items to filter
 * @param {number} lowestLevel - Minimum level (inclusive)
 * @param {number} highestLevel - Maximum level (inclusive)
 * @returns {Array} Filtered items within level range
 */
const filterByLevel = (items, lowestLevel, highestLevel) => {
    return items.filter(item => {
        const level = parseInt(item.level);
        return level >= lowestLevel && level <= highestLevel;
    });
};

/**
 * Filter items based on included and excluded categories and subcategories
 * @param {Array} items - Array of items to filter
 * @param {Array} includedCategories - Array of categories that must be included
 * @param {Array} excludedCategories - Array of categories that must be excluded
 * @param {Array} includedSubcategories - Array of subcategories that must be included
 * @param {Array} excludedSubcategories - Array of subcategories that must be excluded
 * @returns {Array} Filtered items matching category criteria
 */
const filterByCategory = (items, includedCategories, excludedCategories, includedSubcategories, excludedSubcategories) => {
    return items.filter(item => {
        // Check for excluded categories first
        if (excludedCategories.includes(item.item_category)) {
            return false;
        }

        // Check for excluded subcategories
        if (excludedSubcategories.includes(item.item_subcategory)) {
            return false;
        }

        // If there are included categories, item must be in one of them
        if (includedCategories.length > 0 && !includedCategories.includes(item.item_category)) {
            return false;
        }

        // If there are included subcategories, item must be in one of them
        if (includedSubcategories.length > 0 && !includedSubcategories.includes(item.item_subcategory)) {
            return false;
        }

        return true;
    });
};

/**
 * Filter items based on included and excluded traits
 * @param {Array} items - Array of items to filter
 * @param {Array} includedTraits - Array of traits that must be included
 * @param {Array} excludedTraits - Array of traits that must be excluded
 * @returns {Array} Filtered items matching trait criteria
 */
const filterByTraits = (items, includedTraits, excludedTraits) => {
    if (includedTraits.length === 0 && excludedTraits.length === 0) return items;
    
    return items.filter(item => {
        if (!item.trait) return includedTraits.length === 0; // Only keep items without traits if no traits are required
        
        const itemTraits = item.trait.split(',').map(t => t.trim());
        
        // Check for excluded traits first
        if (excludedTraits.some(trait => itemTraits.includes(trait))) {
            return false;
        }
        
        // If there are included traits, item must have at least one of them
        if (includedTraits.length > 0 && !includedTraits.some(trait => itemTraits.includes(trait))) {
            return false;
        }
        
        return true;
    });
};

/**
 * Filter items based on their price relative to other items, influenced by 2D bias
 * @param {Array} items - Array of items to filter
 * @param {Object} itemBias - {x: variety (0-1), y: cost (0-1)}
 * @returns {Array} Filtered items based on bias
 */
const filterByBias = (items, itemBias) => {
    const PRICE_GROUPS = 5; // Must be an odd number
    if (PRICE_GROUPS % 2 === 0) {
        console.warn('PRICE_GROUPS should be an odd number for proper centering');
    }
    
    // Calculate prices for all items
    const itemsWithPrice = items.map(item => ({
        item,
        price: convertPriceToGold(item.price)
    })).filter(x => x.price > 0);

    if (itemsWithPrice.length === 0) return items;

    // Sort by price
    itemsWithPrice.sort((a, b) => a.price - b.price);

    // Calculate price percentiles for grouping
    const priceWindow = 0.4; // Window size for price filtering (40% of price range)
    const priceCenter = itemBias.y; // Center of the window based on cost bias
    const priceStart = Math.max(0, priceCenter - priceWindow/2);
    const priceEnd = Math.min(1, priceCenter + priceWindow/2);

    // Calculate item indices for price range
    const startIndex = Math.floor(priceStart * itemsWithPrice.length);
    const endIndex = Math.ceil(priceEnd * itemsWithPrice.length);

    // Get items within the price range
    const priceFilteredItems = itemsWithPrice.slice(startIndex, endIndex);

    // Calculate how many unique items to keep based on variety bias
    const varietyPercentage = itemBias.x;
    const targetUniqueItems = Math.max(1, Math.ceil(priceFilteredItems.length * varietyPercentage));
    
    // If we want low variety (x close to 0), keep fewer random items
    const shuffled = [...priceFilteredItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, targetUniqueItems);

    // Create a Set of kept items for efficient lookup
    const keptItems = new Set(selectedItems.map(x => x.item));
    
    // Log statistics
    console.log(`Price filtering: keeping items from ${startIndex} to ${endIndex} (${priceFilteredItems.length} items)`);
    console.log(`Variety filtering: keeping ${targetUniqueItems} unique items`);

    // Return only the items that were selected
    return items.filter(item => keptItems.has(item));
};

/**
 * Group items into rarity buckets and filter by maximum price
 * @param {Array} items - Array of items to group
 * @param {number} maxItemPrice - Maximum allowed price per item
 * @returns {Object} Items grouped by rarity
 */
const groupByRarity = (items, maxItemPrice) => {
    const buckets = {
        Common: [],
        Uncommon: [],
        Rare: [],
        Unique: []
    };

    items.forEach(item => {
        const price = convertPriceToGold(item.price);
        if (price > 0 && price <= maxItemPrice) {
            buckets[item.rarity].push(item);
        }
    });

    return buckets;
};

/**
 * Calculate average prices for each rarity and overall
 * @param {Array} items - Array of items
 * @param {number} maxItemPrice - Maximum allowed price per item
 * @returns {Object} Average prices by rarity and overall average
 */
const calculateAveragePrices = (items, maxItemPrice) => {
    // Calculate per-rarity averages
    const avgByRarity = {};
    const rarities = ['Common', 'Uncommon', 'Rare', 'Unique'];
    
    rarities.forEach(rarity => {
        const rarityPrices = items
            .filter(item => item.rarity === rarity)
            .map(item => convertPriceToGold(item.price))
            .filter(price => price > 0 && price <= maxItemPrice);
        
        avgByRarity[rarity] = rarityPrices.length > 0 
            ? rarityPrices.reduce((sum, price) => sum + price, 0) / rarityPrices.length 
            : 0;
    });

    // Calculate overall average
    const validPrices = items
        .map(item => convertPriceToGold(item.price))
        .filter(price => price > 0 && price <= maxItemPrice);
    const overallAverage = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

    return {
        byRarity: avgByRarity,
        overall: overallAverage
    };
};

/**
 * Creates an item selection manager for tracking selected items and totals
 * @returns {Object} Functions for managing item selection
 */
const createItemSelection = () => {
    const items = new Map();
    let totalSpent = 0;
    let remainingGold = 0;  // Track unspent gold

    return {
        addItem: (item, price) => {
            const itemKey = `${item.url}-${item.name}`;
            // Convert traits string to array if it exists
            const traits = item.trait ? item.trait.split(',').map(t => t.trim()) : [];

            if (items.has(itemKey)) {
                const existing = items.get(itemKey);
                existing.count += 1;
                existing.total += price;
            } else {
                items.set(itemKey, {
                    ...item,
                    traits, // Add the traits array
                    count: 1,
                    total: price
                });
            }

            totalSpent += price;
        },
        findLowestPriceItem: (rarity) => {
            let lowestPriceItem = null;
            let lowestPrice = Infinity;

            for (const [key, item] of items.entries()) {
                if (item.rarity === rarity) {
                    const price = convertPriceToGold(item.price);
                    if (price < lowestPrice) {
                        lowestPrice = price;
                        lowestPriceItem = { key, item };
                    }
                }
            }

            return lowestPriceItem;
        },
        setRemainingGold: (amount) => {
            remainingGold = amount;
        },
        getItems: () => Array.from(items.values()),
        getTotalSpent: () => totalSpent,
        getRemainingGold: () => remainingGold
    };
};

/**
 * Main shop generation function
 */
export const generateShop = ({
    currentGold,
    lowestLevel,
    highestLevel,
    itemBias,
    rarityDistribution,
    includedCategories,
    excludedCategories,
    includedSubcategories,
    excludedSubcategories,
    includedTraits,
    excludedTraits,
    allItems
}) => {
    // If the current gold is less than or equal to 0, return an empty array
    if (currentGold <= 0) return { items: [] };

    // Apply filters
    const levelFiltered = filterByLevel(allItems, lowestLevel, highestLevel);
    const categoryFiltered = filterByCategory(
        levelFiltered,
        includedCategories,
        excludedCategories,
        includedSubcategories,
        excludedSubcategories
    );
    const traitFiltered = filterByTraits(categoryFiltered, includedTraits, excludedTraits);
    const biasFiltered = filterByBias(traitFiltered, itemBias);
    const rarityBuckets = groupByRarity(biasFiltered, currentGold);
    const averagePrices = calculateAveragePrices(biasFiltered, currentGold);

    // Log initial state
    Object.entries(rarityBuckets).forEach(([rarity, items]) => {
        console.log(`-- ${rarity} bucket size: ${items.length}`);
    });

    console.log('Generate clicked with settings:', {
        currentGold,
        lowestLevel,
        highestLevel,
        itemBias,
        rarityDistribution,
        includedCategories,
        excludedCategories,
        includedSubcategories,
        excludedSubcategories,
        includedTraits,
        excludedTraits,
        averagePricesByRarity: Object.entries(averagePrices.byRarity).reduce((obj, [rarity, price]) => {
            obj[rarity] = price.toFixed(2) + ' gp';
            return obj;
        }, {})
    });
    
    console.log(`Price limits: max ${currentGold.toFixed(2)} gp per item (100% of total)`);

    // Initialize tracking objects
    const selection = createItemSelection();
    let attempts = 0;
    const MAX_ATTEMPTS = 200000;

    // Helper functions
    const isEmptyBucket = (rarity) => !rarityBuckets[rarity] || rarityBuckets[rarity].length === 0;

    const tryIncreaseQuantity = (rarity) => {
        const lowestPriceItem = selection.findLowestPriceItem(rarity);
        if (!lowestPriceItem) return false;

        const price = convertPriceToGold(lowestPriceItem.item.price);
        const newTotal = selection.getTotalSpent() + price;
        
        if (newTotal > currentGold) {
            return true;
        } else {
            selection.addItem(lowestPriceItem.item, price);
            return selection.getTotalSpent() >= currentGold;
        }
    };

    // Main item selection loop
    while (selection.getTotalSpent() < currentGold && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Check if all buckets are empty
        if (Object.values(rarityBuckets).every(bucket => bucket.length === 0)) {
            selection.setRemainingGold(currentGold - selection.getTotalSpent());
            break;
        }

        // Roll for rarity
        const rarityRoll = Math.random() * 100;
        let selectedRarity;
        let cumulativePercentage = 0;

        for (const [rarity, percentage] of Object.entries(rarityDistribution)) {
            cumulativePercentage += percentage;
            if (rarityRoll <= cumulativePercentage) {
                selectedRarity = rarity;
                break;
            }
        }

        // Handle empty bucket
        if (isEmptyBucket(selectedRarity)) {
            // Adjust quantity increase chance based on variety bias
            const shouldIncreaseQuantity = Math.random() > itemBias.x;
            if (shouldIncreaseQuantity && tryIncreaseQuantity(selectedRarity)) break;
            continue;
        }

        // Select and process random item
        const bucket = rarityBuckets[selectedRarity];
        const randomIndex = Math.floor(Math.random() * bucket.length);
        const selectedItem = bucket[randomIndex];
        const itemPrice = convertPriceToGold(selectedItem.price);
        
        if (selection.getTotalSpent() + itemPrice > currentGold) {
            bucket.splice(randomIndex, 1);
            // console.log(`Removed ${selectedItem.name} (${selectedItem.rarity}, ${selectedItem.price}) from bucket - would exceed target`);
            continue;
        }

        selection.addItem(selectedItem, itemPrice);
    }

    if (attempts >= MAX_ATTEMPTS) {
        console.warn(`Shop generation reached maximum attempts [${MAX_ATTEMPTS}] - stopping for safety`);
        selection.setRemainingGold(currentGold - selection.getTotalSpent());
    }

    console.log(`Generation complete: ${selection.getTotalSpent().toFixed(2)} gp spent, ${selection.getRemainingGold().toFixed(2)} gp remaining, ${selection.getItems().length} unique items`);

    return {
        items: selection.getItems(),
        totalSpent: selection.getTotalSpent(),
        remainingGold: selection.getRemainingGold()
    };
}; 