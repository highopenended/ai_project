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
 * Filter items based on selected categories and subcategories
 * @param {Array} items - Array of items to filter
 * @param {Set} selectedCategories - Set of selected item categories
 * @param {Set} selectedSubcategories - Set of selected item subcategories
 * @returns {Array} Filtered items matching category criteria
 */
const filterByCategory = (items, selectedCategories, selectedSubcategories) => {
    return items.filter(item => {
        if (selectedCategories.size > 0 && !selectedCategories.has(item.item_category)) {
            return false;
        }
        if (selectedSubcategories.size > 0 && !selectedSubcategories.has(item.item_subcategory)) {
            return false;
        }
        return true;
    });
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

            if (items.has(itemKey)) {
                const existing = items.get(itemKey);
                existing.count += 1;
                existing.total += price;
            } else {
                items.set(itemKey, {
                    ...item,
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
    selectedCategories,
    selectedSubcategories,
    allItems
}) => {

    // If the current gold is less than or equal to 0, return an empty array
    if (currentGold <= 0) return { items: [] };

    // Calculate price limits based on quantity/quality bias
    const maxPricePercentage = 0.1 + (itemBias * 0.8); // Scales from 10% to 90%
    const maxItemPrice = currentGold * maxPricePercentage;

    // Apply filters and group items
    const levelFiltered = filterByLevel(allItems, lowestLevel, highestLevel);
    const categoryFiltered = filterByCategory(levelFiltered, selectedCategories, selectedSubcategories);
    const rarityBuckets = groupByRarity(categoryFiltered, maxItemPrice);
    const averagePrices = calculateAveragePrices(categoryFiltered, maxItemPrice);

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
        selectedCategories: Array.from(selectedCategories),
        selectedSubcategories: Array.from(selectedSubcategories),
        averagePricesByRarity: Object.entries(averagePrices.byRarity).reduce((obj, [rarity, price]) => {
            obj[rarity] = price.toFixed(2) + ' gp';
            return obj;
        }, {})
    });
    
    console.log(`Price limits: max ${maxItemPrice.toFixed(2)} gp per item (${(maxPricePercentage * 100).toFixed(1)}% of total)`);

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
            if (tryIncreaseQuantity(selectedRarity)) break;
            continue;
        }

        // Select and process random item
        const bucket = rarityBuckets[selectedRarity];
        const randomIndex = Math.floor(Math.random() * bucket.length);
        const selectedItem = bucket[randomIndex];
        const itemPrice = convertPriceToGold(selectedItem.price);
        
        if (selection.getTotalSpent() + itemPrice > currentGold) {
            bucket.splice(randomIndex, 1);
            console.log(`Removed ${selectedItem.name} (${selectedItem.rarity}, ${selectedItem.price}) from bucket - would exceed target`);
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