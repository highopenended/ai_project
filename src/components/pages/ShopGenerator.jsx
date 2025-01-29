import React, { useState, useEffect } from 'react';
import './shopgenerator/ShopGenerator.css';
import GoldInput from './shopgenerator/leftsidebar/GoldInput';
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
        const match = priceString.match(/(\d+(?:\.\d+)?)\s*(gp|sp|cp)/);
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
        setCurrentGold(gold);
    };

    const handleGenerateClick = () => {
        if (currentGold <= 0) return;

        let remainingGold = currentGold;
        const selectedItems = [];
        const availableItems = [...allItems];

        while (remainingGold > 0 && availableItems.length > 0) {
            // Filter items that are too expensive
            const affordableItems = availableItems.filter(item => {
                const price = convertPriceToGold(item.price);
                return price <= remainingGold && price > 0; // Ensure price is positive
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

            // Remove the selected item from available items
            const originalIndex = availableItems.findIndex(item => item.name === selectedItem.name);
            availableItems.splice(originalIndex, 1);
        }

        setItems(selectedItems);
    };

    if (loading) {
        return <div className="content-area">Loading...</div>;
    }

    return (
        <div className="content-area">
            <div className="content-container">
                <LeftSidebar onGenerate={handleGenerateClick}>
                    <GoldInput onChange={handleGoldChange} />
                </LeftSidebar>
                <div className="shop-generator-main">
                    <h1>Shop Generator</h1>
                    <ItemTable items={items} />
                </div>
            </div>
        </div>
    );
}

export default ShopGenerator; 
