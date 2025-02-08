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
import { generateShopInventory } from './utils/generateShopInventory';
import CategoryFilter from './leftsidebar/CategoryFilter';
import SubcategoryFilter from './leftsidebar/SubcategoryFilter';
import TraitFilter from './leftsidebar/TraitFilter';
import shopData from './utils/shopData';
import { saveOrUpdateShopData, loadShopData } from './utils/firebaseShopUtils';
import { useAuth } from '../../../context/AuthContext';

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
        subcategoryStates
    } = useCategoryContext();

    const {
        traitStates
    } = useTraitContext();

    const { currentUser } = useAuth();

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
    const [currentShop, setCurrentShop] = useState(shopData);
    const [savedShops, setSavedShops] = useState([]);

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

        const result = generateShopInventory({
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

    // Function to safely convert Map to array of included/excluded items
    const getFilteredArray = (stateMap, includeState, defaultMap = new Map()) => {
        if (!stateMap) stateMap = defaultMap;
        return Array.from(stateMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    };

    // Function to save shop to Firebase
    const handleSaveShop = async () => {
        try {
            const userId = currentUser.uid;
            // Ensure we have the latest state of everything
            const shopDataWithId = {
                ...currentShop,
                id: currentShop.id || '', // Preserve existing ID if it exists
                shortData: {
                    shopName: currentShop.shortData.shopName || '',
                    shopKeeperName: currentShop.shortData.shopKeeperName || '',
                    type: currentShop.shortData.type || '',
                    location: currentShop.shortData.location || ''
                },
                longData: {
                    shopDetails: currentShop.longData.shopDetails || '',
                    shopKeeperDetails: currentShop.longData.shopKeeperDetails || '' // Fixed capitalization
                },
                parameters: {
                    ...currentShop.parameters,
                    goldAmount: currentGold,
                    levelLow: lowestLevel,
                    levelHigh: highestLevel,
                    shopBias: itemBias,
                    rarityDistribution,
                    categories: {
                        included: getFilteredArray(categoryStates, SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray(categoryStates, SELECTION_STATES.EXCLUDE)
                    },
                    subcategories: {
                        included: getFilteredArray(subcategoryStates, SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray(subcategoryStates, SELECTION_STATES.EXCLUDE)
                    },
                    traits: {
                        included: getFilteredArray(traitStates, TRAIT_STATES.INCLUDE),
                        excluded: getFilteredArray(traitStates, TRAIT_STATES.EXCLUDE)
                    },
                    currentStock: items
                },
                dateLastEdited: new Date(),
                dateCreated: currentShop.dateCreated || new Date() // Preserve creation date or set new one
            };
            const shopId = await saveOrUpdateShopData(userId, shopDataWithId);
            setCurrentShop(prevDetails => ({
                ...prevDetails,
                id: shopId
            }));
            console.log('Shop saved with ID:', shopId); // Debug log
            alert('Shop saved successfully!');
        } catch (error) {
            console.error('Error saving shop:', error);
            alert('Error saving shop. Please try again.');
        }
    };

    // Function to load shops from Firebase
    const loadShops = async () => {
        try {
            const userId = currentUser.uid;
            const shops = await loadShopData(userId);
            setSavedShops(shops);
        } catch (error) {
            console.error('Error loading shops:', error);
        }
    };

    useEffect(() => {
        loadShops();
    }, []);

    useEffect(() => {
        setCurrentShop(prevShop => ({
            ...prevShop,
            parameters: {
                ...prevShop.parameters,
                goldAmount: currentGold,
                levelLow: lowestLevel,
                levelHigh: highestLevel,
                shopBias: itemBias,
                rarityDistribution,
                categories: {
                    included: Array.from((categoryStates || new Map()).entries())
                        .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                        .map(([category]) => category),
                    excluded: Array.from((categoryStates || new Map()).entries())
                        .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                        .map(([category]) => category)
                },
                subcategories: {
                    included: Array.from((subcategoryStates || new Map()).entries())
                        .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                        .map(([subcategory]) => subcategory),
                    excluded: Array.from((subcategoryStates || new Map()).entries())
                        .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                        .map(([subcategory]) => subcategory)
                },
                traits: {
                    included: Array.from((traitStates || new Map()).entries())
                        .filter(([, state]) => state === TRAIT_STATES.INCLUDE)
                        .map(([trait]) => trait),
                    excluded: Array.from((traitStates || new Map()).entries())
                        .filter(([, state]) => state === TRAIT_STATES.EXCLUDE)
                        .map(([trait]) => trait)
                },
                currentStock: items
            }
        }));
    }, [currentGold, lowestLevel, highestLevel, itemBias, rarityDistribution, categoryStates, subcategoryStates, traitStates, items]);

    // Add this new handler function after the other handlers
    const handleShopDetailsChange = (e) => {
        const { name, value } = e.target;
        console.log('Handling shop details change:', { name, value }); // Debug log
        setCurrentShop(prevShop => {
            // Create a copy of the previous shop
            const newShop = { ...prevShop };

            // Check if this is a shortData field
            if (Object.keys(prevShop.shortData).includes(name)) {
                newShop.shortData = {
                    ...prevShop.shortData,
                    [name]: value
                };
            }
            // Check if this is a longData field
            else if (Object.keys(prevShop.longData).includes(name)) {
                newShop.longData = {
                    ...prevShop.longData,
                    [name]: value
                };
            }

            console.log('Updated shop:', newShop); // Debug log
            return newShop;
        });
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
                    <CategoryFilter />
                    <SubcategoryFilter />
                    <TraitFilter />
                </LeftSidebar>
                <MiddleBar>
                    <ItemTable
                        items={items}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        currentShop={currentShop.shortData.shopName || 'Unnamed Shop'}
                    />
                </MiddleBar>
                <RightSidebar 
                    onSave={handleSaveShop}
                    savedShops={savedShops}
                    currentShop={currentShop}
                    onShopDetailsChange={handleShopDetailsChange}
                />
            </div>
        </div>
    );
}

export default ShopGenerator; 

