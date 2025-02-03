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
import { generateShop } from './shopgenerator/utils/generateShop';

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
    const [hasInitialSort, setHasInitialSort] = useState(false);
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
            
            // Set initial sort only once when component mounts
            if (!hasInitialSort) {
                setSortConfig([{ column: 'total', direction: 'desc' }]);
                setHasInitialSort(true);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            setLoading(false);
        }
    }, [hasInitialSort]);

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
        const result = generateShop({
            currentGold,
            lowestLevel,
            highestLevel,
            itemBias,
            rarityDistribution,
            selectedCategories,
            selectedSubcategories,
            allItems
        });

        // Don't modify sort config here anymore
        setItems(sortItems(result.items));
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
