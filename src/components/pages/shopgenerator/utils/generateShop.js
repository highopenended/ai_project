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
    if (currentGold <= 0) return { items: [] };

    // Calculate price limits based on quantity/quality bias
    // itemBias of 0 = quantity (10% max), 0.5 = balanced (50% max), 1 = quality (90% max)
    const maxPricePercentage = 0.1 + (itemBias * 0.8); // Scales from 10% to 90%
    const maxItemPrice = currentGold * maxPricePercentage;

    // 1. Filter by level range
    const levelFiltered = allItems.filter(item => {
        const level = parseInt(item.level);
        return level >= lowestLevel && level <= highestLevel;
    });

    // 2. Filter by categories and subcategories
    const categoryFiltered = levelFiltered.filter(item => {
        if (selectedCategories.size > 0 && !selectedCategories.has(item.item_category)) {
            return false;
        }
        if (selectedSubcategories.size > 0 && !selectedSubcategories.has(item.item_subcategory)) {
            return false;
        }
        return true;
    });

    // 3. Filter by price and group by rarity
    const rarityBuckets = {
        Common: [],
        Uncommon: [],
        Rare: [],
        Unique: []
    };

    categoryFiltered.forEach(item => {
        const price = convertPriceToGold(item.price);
        if (price > 0 && price <= maxItemPrice) {
            rarityBuckets[item.rarity].push(item);
        }
    });

    // Log bucket sizes for debugging
    Object.entries(rarityBuckets).forEach(([rarity, items]) => {
        console.log(`${rarity} bucket size: ${items.length}`);
    });

    // Calculate average prices by rarity
    const avgPricesByRarity = {};
    Object.keys(rarityBuckets).forEach(rarity => {
        const rarityPrices = categoryFiltered
            .filter(item => item.rarity === rarity)
            .map(item => convertPriceToGold(item.price))
            .filter(price => price > 0 && price <= maxItemPrice);
        
        avgPricesByRarity[rarity] = rarityPrices.length > 0 
            ? rarityPrices.reduce((sum, price) => sum + price, 0) / rarityPrices.length 
            : 0;
    });

    // Calculate overall average for lockbox functionality
    const validPrices = categoryFiltered
        .map(item => convertPriceToGold(item.price))
        .filter(price => price > 0 && price <= maxItemPrice);
    const averagePrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

    console.log('Generate clicked with settings:', {
        currentGold,
        lowestLevel,
        highestLevel,
        itemBias,
        rarityDistribution,
        selectedCategories: Array.from(selectedCategories),
        selectedSubcategories: Array.from(selectedSubcategories),
        averagePricesByRarity: Object.entries(avgPricesByRarity).reduce((obj, [rarity, price]) => {
            obj[rarity] = price.toFixed(2) + ' gp';
            return obj;
        }, {})
    });
    
    console.log(`Price limits: max ${maxItemPrice.toFixed(2)} gp per item (${(maxPricePercentage * 100).toFixed(1)}% of total)`);

    // 4. Random Selection
    const selectedItems = new Map();
    let totalSpent = 0;
    let lockBoxValue = 0;
    const MAX_ITEMS = 1000;
    let attempts = 0;
    const MAX_ATTEMPTS = 10000; // Safety limit

    const addToLockBox = (amount) => {
        lockBoxValue += amount;
        console.log(`Added ${amount.toFixed(2)} gp to lockbox. New lockbox total: ${lockBoxValue.toFixed(2)} gp`);
    };

    const getTotalWithLockBox = () => totalSpent + lockBoxValue;

    const isEmptyBucket = (rarity) => !rarityBuckets[rarity] || rarityBuckets[rarity].length === 0;

    const tryIncreaseQuantity = (rarity) => {
        // Find existing item of this rarity with the lowest price
        let lowestPriceItem = null;
        let lowestPrice = Infinity;

        for (const [key, item] of selectedItems.entries()) {
            if (item.rarity === rarity) {
                const price = convertPriceToGold(item.price);
                if (price < lowestPrice) {
                    lowestPrice = price;
                    lowestPriceItem = { key, item };
                }
            }
        }

        if (lowestPriceItem) {
            const newTotal = getTotalWithLockBox() + lowestPrice;
            
            if (newTotal > currentGold) {
                // Would exceed target, add to lockbox
                addToLockBox(averagePrice);
                return true;
            } else {
                // Increase quantity
                const item = selectedItems.get(lowestPriceItem.key);
                item.count += 1;
                item.total += lowestPrice;
                totalSpent += lowestPrice;
                return newTotal >= currentGold;  // Return true if we should stop
            }
        }
        return false;
    };

    while (getTotalWithLockBox() < currentGold && selectedItems.size < MAX_ITEMS && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Check if all buckets are empty
        if (Object.values(rarityBuckets).every(bucket => bucket.length === 0)) {
            const remaining = currentGold - getTotalWithLockBox();
            if (remaining > 0) {
                addToLockBox(averagePrice);
            }
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

        const bucket = rarityBuckets[selectedRarity];
        const randomIndex = Math.floor(Math.random() * bucket.length);
        const selectedItem = bucket[randomIndex];
        const itemPrice = convertPriceToGold(selectedItem.price);
        
        const newTotal = getTotalWithLockBox() + itemPrice;

        // Check if this would exceed our limits
        if (newTotal > currentGold) {
            // Remove item from bucket permanently
            bucket.splice(randomIndex, 1);
            console.log(`Removed ${selectedItem.name} (${selectedItem.rarity}, ${selectedItem.price}) from bucket - would exceed target`);
            continue;
        }

        const itemKey = `${selectedItem.url}-${selectedItem.name}`;

        // Update the item count and totals
        if (selectedItems.has(itemKey)) {
            const existing = selectedItems.get(itemKey);
            existing.count += 1;
            existing.total += itemPrice;
        } else {
            selectedItems.set(itemKey, {
                ...selectedItem,
                count: 1,
                total: itemPrice
            });
        }

        totalSpent += itemPrice;

        // Check if we should stop
        if (getTotalWithLockBox() >= currentGold) break;
    }

    if (attempts >= MAX_ATTEMPTS) {
        console.warn('Shop generation reached maximum attempts - stopping for safety');
    }

    // Add lockbox as a special item if it has value
    if (lockBoxValue > 0) {
        selectedItems.set('lockbox', {
            name: 'Shop Lockbox',
            rarity: 'Common',
            level: '0',
            price: lockBoxValue.toFixed(2) + ' gp',
            item_category: 'Services',
            item_subcategory: 'Storage',
            count: 1,
            total: lockBoxValue,
            url: '#'
        });
    }

    console.log(`Generation complete: ${totalSpent.toFixed(2)} gp spent, ${lockBoxValue.toFixed(2)} gp in lockbox, ${selectedItems.size} unique items`);

    return {
        items: Array.from(selectedItems.values()),
        totalSpent,
        lockBoxValue
    };
}; 