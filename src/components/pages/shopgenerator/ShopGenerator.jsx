/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
/* eslint-enable no-unused-vars */
import './ShopGenerator.css';
import LeftSidebar from './leftsidebar/LeftSidebar';
import GoldInput from './leftsidebar/goldinput/GoldInput';
import LevelInput from './leftsidebar/levelinput/LevelInput';
import BiasGrid from './leftsidebar/biasgrid/BiasGrid';
import RaritySliders from './leftsidebar/raritysliders/RaritySliders';
import MiddleBar from './middlebar/MiddleBar';
import RightSidebar from './rightsidebar/RightSidebar';
import ItemTable from './middlebar/ItemTable';
import itemData from '../../../../public/item-table.json';
import { useCategoryContext, SELECTION_STATES } from './context/CategoryContext';
import { useTraitContext, TRAIT_STATES } from './context/TraitContext';
import { generateShop } from './utils/generateShop';

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
        categoryStates,
        subcategoryStates,
        setCategoryStates,
        setSubcategoryStates
    } = useCategoryContext();

    const {
        traitStates,
        setTraitStates
    } = useTraitContext();

    // State management
    const [items, setItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentGold, setCurrentGold] = useState(0);
    const [lowestLevel, setLowestLevel] = useState(0);
    const [highestLevel, setHighestLevel] = useState(10);
    const [sortConfig, setSortConfig] = useState([]);
    const [itemBias, setItemBias] = useState({ x: 0.5, y: 0.5 }); // Default to center
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

    // Initial data loading
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

    // Handle sorting when sortConfig changes
    useEffect(() => {
        if (items.length > 0) {
            setItems(sortItems(items));
        }
    }, [sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps

    // Price conversion helper
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

    // Sorting functionality
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

    const sortItems = (itemsToSort) => {
        if (!sortConfig.length) return itemsToSort;

        return [...itemsToSort].sort((a, b) => {
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

    // Shop generation
    const handleGenerateClick = () => {
        // Convert Maps to arrays of included/excluded items
        const includedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([category]) => category);
        
        const excludedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([category]) => category);

        const includedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([subcategory]) => subcategory);
        
        const excludedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([subcategory]) => subcategory);

        const includedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === TRAIT_STATES.INCLUDE)
            .map(([trait]) => trait);
        
        const excludedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === TRAIT_STATES.EXCLUDE)
            .map(([trait]) => trait);

        const result = generateShop({
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
        });

        // Apply sorting to the newly generated items
        const sortedItems = sortItems(result.items);
        setItems(sortedItems);
    };

    // Add handler functions
    const handleGoldChange = (gold) => {
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

    // Add these props to pass to RightSidebar
    const handleSaveShop = async (shopDetails) => {
        const shopData = {
            ...shopDetails,
            // LeftSidebar Parameters
            goldAmount: currentGold,
            levelRange: {
                low: lowestLevel,
                high: highestLevel
            },
            shopBias: itemBias,
            rarityDistribution,
            categories: {
                included: Array.from(categoryStates.entries())
                    .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                    .map(([category]) => category),
                excluded: Array.from(categoryStates.entries())
                    .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                    .map(([category]) => category)
            },
            subcategories: {
                included: Array.from(subcategoryStates.entries())
                    .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                    .map(([subcategory]) => subcategory),
                excluded: Array.from(subcategoryStates.entries())
                    .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                    .map(([subcategory]) => subcategory)
            },
            traits: {
                included: Array.from(traitStates.entries())
                    .filter(([, state]) => state === TRAIT_STATES.INCLUDE)
                    .map(([trait]) => trait),
                excluded: Array.from(traitStates.entries())
                    .filter(([, state]) => state === TRAIT_STATES.EXCLUDE)
                    .map(([trait]) => trait)
            },
            // MiddleBar Data
            currentStock: items
        };
        return shopData;
    };

    const handleLoadShop = (shopData) => {
        try {
            // Update LeftSidebar state
            setCurrentGold(shopData.goldAmount || 0);
            setLowestLevel(shopData.levelRange?.low || 0);
            setHighestLevel(shopData.levelRange?.high || 10);
            setItemBias(shopData.shopBias || { x: 0.5, y: 0.5 });
            setRarityDistribution(shopData.rarityDistribution || {
                Common: 95.00,
                Uncommon: 4.50,
                Rare: 0.49,
                Unique: 0.01
            });

            // Clear existing states
            const newCategoryStates = new Map();
            const newSubcategoryStates = new Map();
            const newTraitStates = new Map();

            // Update category states
            if (shopData.categories) {
                shopData.categories.included?.forEach(category => {
                    newCategoryStates.set(category, SELECTION_STATES.INCLUDE);
                });
                shopData.categories.excluded?.forEach(category => {
                    newCategoryStates.set(category, SELECTION_STATES.EXCLUDE);
                });
            }
            setCategoryStates(newCategoryStates);

            // Update subcategory states
            if (shopData.subcategories) {
                shopData.subcategories.included?.forEach(subcategory => {
                    newSubcategoryStates.set(subcategory, SELECTION_STATES.INCLUDE);
                });
                shopData.subcategories.excluded?.forEach(subcategory => {
                    newSubcategoryStates.set(subcategory, SELECTION_STATES.EXCLUDE);
                });
            }
            setSubcategoryStates(newSubcategoryStates);

            // Update trait states
            if (shopData.traits) {
                shopData.traits.included?.forEach(trait => {
                    newTraitStates.set(trait, TRAIT_STATES.INCLUDE);
                });
                shopData.traits.excluded?.forEach(trait => {
                    newTraitStates.set(trait, TRAIT_STATES.EXCLUDE);
                });
            }
            setTraitStates(newTraitStates);

            // Update items
            setItems(shopData.currentStock || []);
        } catch (error) {
            console.error('Error loading shop data:', error);
        }
    };

    if (loading) {
        return <div className="content-area">Loading...</div>;
    }

    return (
        <div className="content-area">
            <div className="content-container">
                <LeftSidebar onGenerate={handleGenerateClick}>
                    <GoldInput onChange={handleGoldChange} value={currentGold} />
                    <LevelInput
                        lowestLevel={lowestLevel}
                        highestLevel={highestLevel}
                        onLowestLevelChange={handleLowestLevelChange}
                        onHighestLevelChange={handleHighestLevelChange}
                    />
                    <BiasGrid onChange={handleBiasChange} value={itemBias} />
                    <RaritySliders onChange={handleRarityDistributionChange} value={rarityDistribution} />
                </LeftSidebar>
                <MiddleBar>
                    <ItemTable
                        items={items}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </MiddleBar>
                <RightSidebar 
                    onSave={handleSaveShop}
                    onLoad={handleLoadShop}
                />
            </div>
        </div>
    );
}

export default ShopGenerator; 