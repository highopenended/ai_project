/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
/* eslint-enable no-unused-vars */
import './shopgenerator/ShopGenerator.css';
import GoldInput from './shopgenerator/leftsidebar/GoldInput';
import LevelInput from './shopgenerator/leftsidebar/LevelInput';
import LeftSidebar from './shopgenerator/leftsidebar/LeftSidebar';
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

    const handleGenerateClick = () => {
        console.log('Current gold when generating:', currentGold, typeof currentGold);
        if (currentGold <= 0) return;

        let remainingGold = currentGold;
        const selectedItems = [];
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

            // Get a random affordable item
            const randomIndex = Math.floor(Math.random() * affordableItems.length);
            const selectedItem = affordableItems[randomIndex];
            const itemPrice = convertPriceToGold(selectedItem.price);

            // Add the item and update remaining gold
            selectedItems.push(selectedItem);
            remainingGold -= itemPrice;
            totalSpent += itemPrice;
            console.log(`Added item ${selectedItem.name} for ${itemPrice}gp. Total spent: ${totalSpent}gp. Remaining: ${remainingGold}gp`);

            // Remove the selected item from available items using the URL as a unique identifier
            const originalIndex = availableItems.findIndex(item => item.url === selectedItem.url);
            if (originalIndex !== -1) {
                availableItems.splice(originalIndex, 1);
            }
        }

        if (iterationCount >= MAX_ITERATIONS) {
            console.warn('Shop generation reached maximum iterations - stopping for safety');
        }

        // Sort items by price before setting them
        const sortedItems = selectedItems.sort((a, b) => {
            const priceA = convertPriceToGold(a.price);
            const priceB = convertPriceToGold(b.price);
            return priceB - priceA;
        });

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
                </LeftSidebar>
                <div className="shop-generator-main">
                    <ItemTable items={items} />
                </div>
            </div>
        </div>
    );
}

export default ShopGenerator; 
