/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
/* eslint-enable no-unused-vars */
import './shopgenerator/ShopGenerator.css';
import GoldInput from './shopgenerator/leftsidebar/GoldInput';
import LevelInput from './shopgenerator/leftsidebar/LevelInput';
import BiasSlider from './shopgenerator/leftsidebar/BiasSlider';
import LeftSidebar from './shopgenerator/leftsidebar/LeftSidebar';
import RaritySliders from './shopgenerator/leftsidebar/raritysliders/RaritySliders';
import ItemTable from './shopgenerator/ItemTable';
import itemData from '../../../public/item-table.json';  // Import JSON directly
import { useCategoryContext } from '../../context/CategoryContext';

/**
 * Shop Generator Component
 * 
 * A tool for generating fantasy shops and their inventories.
 * 
 * Features:
 * - Generate different types of shops
 * - Customize shop parameters
 * - Generate and manage inventories
 * - Save favorite shops
 */
function ShopGenerator() {
    const {
        selectedCategories,
        selectedSubcategories
    } = useCategoryContext();

    const [items, setItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentGold, setCurrentGold] = useState(0);
    const [lowestLevel, setLowestLevel] = useState(0);
    const [highestLevel, setHighestLevel] = useState(10);
    const [sortConfig, setSortConfig] = useState([]);
    const [itemBias, setItemBias] = useState(0.5); // Default to balanced distribution
    const [avgPrice, setAvgPrice] = useState({
        Common: 0,
        Uncommon: 0,
        Rare: 0,
        Unique: 0
    });
    const [rarityDistribution, setRarityDistribution] = useState({
        Common: 95.00,
        Uncommon: 4.50,
        Rare: 0.49,
        Unique: 0.01
    });

    // Rarity order map for sorting (from least rare to most rare)
    const RARITY_ORDER = {
        'Common': 1,
        'Uncommon': 2,
        'Rare': 3,
        'Unique': 4
    };

    useEffect(() => {
        try {
            // Format and process the imported data
            console.log('Raw itemData length:', itemData.length);
            
            const formattedData = itemData.map(item => ({
                ...item,
                bulk: item.bulk?.trim() === '' ? '-' : item.bulk,
                level: item.level ? item.level : '0'
            }));
            
            setAllItems(formattedData);
            setLoading(false);
            
            
        } catch (error) {
            console.error('Error loading items:', error);
            setLoading(false);
        }
    }, []);

    const convertPriceToGold = (priceString) => {
        if (!priceString) return 0;
        
        // Remove commas from the price string before parsing
        const cleanPriceString = priceString.replace(/,/g, '');
        const match = cleanPriceString.match(/(\d+(?:\.\d+)?)\s*(gp|sp|cp)/);
        if (!match) return 0;

        const [, value, unit] = match;
        const numValue = parseFloat(value);

        switch (unit) {
            case 'gp': return numValue;
            case 'sp': return numValue / 10;
            case 'cp': return numValue / 100;
            default: return 0;
        }
    };

    const handleGoldChange = (gold) => {
        console.log('Gold value received:', gold, typeof gold);
        setCurrentGold(gold);
    };

    const handleLowestLevelChange = (level) => {
        setLowestLevel(level);
    };

    const handleHighestLevelChange = (level) => {
        setHighestLevel(level);
    };

    const handleBiasChange = (bias) => {
        setItemBias(bias);
    };

    const handleRarityDistributionChange = (newDistribution) => {
        setRarityDistribution(newDistribution);
    };

    // Helper function to get the next sort direction
    const getNextSortDirection = (currentDirection, columnName) => {
        // Special handling for text-based columns
        if (columnName === 'name' || columnName === 'item_category' || columnName === 'item_subcategory') {
            switch (currentDirection) {
                case undefined: return 'asc';  // First click: alphabetical
                case 'asc': return 'desc';     // Second click: reverse alphabetical
                case 'desc': return undefined; // Third click: back to default
                default: return undefined;
            }
        }
        
        // Default behavior for price and total
        switch (currentDirection) {
            case undefined: return 'desc';
            case 'desc': return 'asc';
            case 'asc': return undefined;
            default: return undefined;
        }
    };

    // Handle column header clicks for sorting
    const handleSort = (columnName) => {
        setSortConfig(prevConfig => {
            // Remove the column if it exists in the current config
            const newConfig = prevConfig.filter(sort => sort.column !== columnName);
            
            // Get the current direction for this column
            const currentDirection = prevConfig.find(sort => sort.column === columnName)?.direction;
            
            // Get the next direction in the cycle
            const nextDirection = getNextSortDirection(currentDirection, columnName);
            
            // If there's a next direction, add it to the end of the queue
            if (nextDirection) {
                newConfig.push({ column: columnName, direction: nextDirection });
            }
            
            return newConfig;
        });
    };

    // Apply multi-column sorting
    const sortItems = (items) => {
        if (!sortConfig.length) return items;

        return [...items].sort((a, b) => {
            for (const { column, direction } of sortConfig) {
                let comparison = 0;
                
                switch (column) {
                    case 'count':
                        comparison = a.count - b.count;
                        break;
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'level':
                        comparison = parseInt(a.level) - parseInt(b.level);
                        break;
                    case 'price':
                        comparison = convertPriceToGold(a.price) - convertPriceToGold(b.price);
                        break;
                    case 'total':
                        comparison = a.total - b.total;
                        break;
                    case 'rarity':
                        comparison = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
                        break;
                    case 'item_category':
                        comparison = (a.item_category || '').localeCompare(b.item_category || '');
                        break;
                    case 'item_subcategory':
                        comparison = (a.item_subcategory || '').localeCompare(b.item_subcategory || '');
                        break;
                    default:
                        comparison = 0;
                }

                if (comparison !== 0) {
                    // For text-based columns, flip the comparison direction to match natural alphabetical order
                    if (column === 'name' || column === 'item_category' || column === 'item_subcategory') {
                        return direction === 'asc' ? comparison : -comparison;
                    }
                    // For all other columns, maintain the existing direction logic
                    return direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    };

    const handleGenerateClick = () => {
        if (currentGold <= 0) return;

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
        setAvgPrice(avgPricesByRarity);

        // Calculate overall average for lockbox functionality
        const validPrices = categoryFiltered.map(item => convertPriceToGold(item.price)).filter(price => price > 0 && price <= maxItemPrice);
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
        const targetMax = currentGold * 1.1;  // +10% of target
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
                
                if (newTotal > targetMax) {
                    // Would exceed 110%, add to lockbox
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
            if (newTotal > targetMax) {
                // Remove item from bucket permanently
                bucket.splice(randomIndex, 1);
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

        // Convert Map to array and sort
        const itemsArray = Array.from(selectedItems.values());
        setSortConfig([{ column: 'total', direction: 'desc' }]);
        setItems(sortItems(itemsArray));
    };

    if (loading) {
        return <div className="content-area">Loading...</div>;
    }

    return (
        <div className="content-area">
            <div className="content-container">
                <LeftSidebar onGenerate={handleGenerateClick}>
                    <GoldInput onChange={handleGoldChange} />
                    <LevelInput
                        lowestLevel={lowestLevel}
                        highestLevel={highestLevel}
                        onLowestLevelChange={handleLowestLevelChange}
                        onHighestLevelChange={handleHighestLevelChange}
                    />
                    <BiasSlider onChange={handleBiasChange} />
                    <RaritySliders onChange={handleRarityDistributionChange} />
                </LeftSidebar>
                <div className="shop-generator-main">
                    <ItemTable 
                        items={sortItems(items)} 
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </div>
            </div>
        </div>
    );
}

export default ShopGenerator; 
