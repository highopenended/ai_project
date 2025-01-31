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
    const [items, setItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentGold, setCurrentGold] = useState(0);
    const [lowestLevel, setLowestLevel] = useState(1);
    const [highestLevel, setHighestLevel] = useState(20);
    const [sortConfig, setSortConfig] = useState([]);
    const [itemBias, setItemBias] = useState(0.5); // Default to balanced distribution
    const [rarityDistribution, setRarityDistribution] = useState({
        Common: 95.00,
        Uncommon: 4.50,
        Rare: 0.49,
        Unique: 0.01
    });

    useEffect(() => {
        fetch('/item-table.json')
            .then(response => response.json())
            .then(data => {
                setAllItems(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading items:', error);
                setLoading(false);
            });
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
    const getNextSortDirection = (currentDirection) => {
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
            const nextDirection = getNextSortDirection(currentDirection);
            
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
                    default:
                        comparison = 0;
                }

                if (comparison !== 0) {
                    return direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    };

    const handleGenerateClick = () => {
        console.log('Current gold when generating:', currentGold, typeof currentGold);
        if (currentGold <= 0) return;

        let remainingGold = currentGold;
        const selectedItems = new Map(); // Use a Map to track items and their counts
        const availableItems = [...allItems];
        let totalSpent = 0;
        let iterationCount = 0;
        const MAX_ITERATIONS = 1000; // Safety limit

        while (remainingGold > 0 && availableItems.length > 0 && iterationCount < MAX_ITERATIONS) {
            iterationCount++;
            
            // Filter items that are too expensive and within level range
            const affordableItems = availableItems.filter(item => {
                const price = convertPriceToGold(item.price);
                const level = parseInt(item.level);
                return price <= remainingGold && 
                       price > 0 && 
                       level >= lowestLevel && 
                       level <= highestLevel;
            });

            // If no affordable items left, break
            if (affordableItems.length === 0) break;

            // Apply rarity distribution to select an item
            // First, determine which rarity tier we'll select from based on the distribution
            const rarityRoll = Math.random() * 100; // Roll 0-100
            let selectedRarity;
            let cumulativePercentage = 0;

            for (const [rarity, percentage] of Object.entries(rarityDistribution)) {
                cumulativePercentage += percentage;
                if (rarityRoll <= cumulativePercentage) {
                    selectedRarity = rarity;
                    break;
                }
            }

            // Filter items by the selected rarity
            const rarityFilteredItems = affordableItems.filter(item => item.rarity === selectedRarity);
            
            // If no items of selected rarity, try again with any rarity
            const itemsToUse = rarityFilteredItems.length > 0 ? rarityFilteredItems : affordableItems;

            // Sort filtered items by price and apply bias
            const sortedItems = itemsToUse.sort((a, b) => {
                const priceA = convertPriceToGold(a.price);
                const priceB = convertPriceToGold(b.price);
                return priceB - priceA; // Sort by descending price
            });

            // Calculate index based on bias
            // itemBias of 0 favors cheaper items (end of array)
            // itemBias of 1 favors expensive items (start of array)
            // Add some randomness to avoid pure deterministic selection
            const randomFactor = Math.random() * 0.3 - 0.15; // Random value between -0.15 and 0.15
            const biasedIndex = Math.floor((1 - (itemBias + randomFactor)) * (sortedItems.length - 1));
            const selectedItem = sortedItems[Math.max(0, Math.min(sortedItems.length - 1, biasedIndex))];

            const itemPrice = convertPriceToGold(selectedItem.price);

            // Create a unique key combining URL and full name
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

            // Update remaining gold
            remainingGold -= itemPrice;
            totalSpent += itemPrice;
            console.log(`Added item ${selectedItem.name} for ${itemPrice}gp. Total spent: ${totalSpent}gp. Remaining: ${remainingGold}gp`);
        }

        if (iterationCount >= MAX_ITERATIONS) {
            console.warn('Shop generation reached maximum iterations - stopping for safety');
        }

        // Convert Map to array
        const itemsArray = Array.from(selectedItems.values());
        
        // Set initial sort config for Total column
        setSortConfig([{ column: 'total', direction: 'desc' }]);
        
        // Apply current sorting configuration
        const sortedItems = sortItems(itemsArray);
        
        setItems(sortedItems);
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
