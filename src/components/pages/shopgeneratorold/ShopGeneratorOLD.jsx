/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
/* eslint-enable no-unused-vars */
import './ShopGenerator.css';
import LeftSidebar from './LeftSidebar';
import GoldInput from './leftsidebar/goldinput/GoldInput';
import LevelInput from '../shopgenerator/tabs/tab_parameters/levelinput/LevelInput';
import BiasGrid from '../shopgenerator/tabs/tab_parameters/biasgrid/BiasGrid';
import RaritySliders from './leftsidebar/raritysliders/RaritySliders';
import MiddleBar from './MiddleBar';
import RightSidebar from './RightSidebar';
import ItemTable from '../shopgenerator/tabs/tab_inventorytable/ItemTable';
import itemData from '../../../../public/item-table.json';
import { useShopGenerator } from '../../../context/ShopGeneratorContext';
import { SELECTION_STATES} from '../../../context/shopGeneratorConstants';
import { generateShopInventory } from '../shopgenerator/utils/generateShopInventory';
import CategoryFilter from '../shopgenerator/tabs/tab_parameters/CategoryFilter';
import SubcategoryFilter from '../shopgenerator/tabs/tab_parameters/SubcategoryFilter';
import TraitFilter from '../shopgenerator/tabs/tab_parameters/TraitFilter';
import shopData from '../shopgenerator/utils/shopData';
import { saveOrUpdateShopData, loadShopData } from '../shopgenerator/utils/firebaseShopUtils';
import { useAuth } from '../../../context/AuthContext';

/**
 * Shop Generator Component
 * 
 * This is the main stateful component that manages the entire shop generation system.
 * It serves as the single source of truth for all state and handles all data persistence.
 * 
 * Architecture Notes for AI:
 * - This component is the top-level manager for all shop-related state and operations
 * - All saving/loading/state management happens here, child components are "dumb" UI components
 * - Child components receive state and callbacks as props, maintaining unidirectional data flow
 * 
 * Key State Categories:
 * 1. Shop Configuration: currentGold, levels, itemBias, rarityDistribution
 * 2. Filtering State: categoryStates, subcategoryStates, traitStates (managed via contexts)
 * 3. Shop Data: currentShop (details), items (inventory)
 * 4. UI State: loading, sortConfig
 * 
 * Data Flow:
 * - User actions in child components → callbacks here → state updates → props update children
 * - Save/Load operations are centralized here to maintain data consistency
 * - State updates trigger useEffect hooks to keep derived state in sync
 * 
 * @component
 */
function ShopGenerator() {
    // Context hooks for filter states
    // These are used by the Category/Subcategory/Trait filters in the left sidebar
    const {
        categoryStates,
        subcategoryStates,
        setCategoryStates,
        setSubcategoryStates,
        traitStates,
        setTraitStates
    } = useShopGenerator();

    const { currentUser } = useAuth();

    // Core state management
    // These states represent the complete state of the shop generator
    const [items, setItems] = useState([]); // Current shop inventory
    const [allItems, setAllItems] = useState([]); // Master list of all possible items
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
    
    // Shop state management
    // currentShop contains all metadata and parameters for the current shop
    // savedShops maintains the list of all shops for the current user
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
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([trait]) => trait);
        
        const excludedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
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

    /**
     * Handles saving the current shop state to Firebase
     * This is the single point of persistence for shop data
     * Called by the RightSidebar's SaveShopButton
     */
    const handleSaveShop = async () => {
        try {
            const userId = currentUser.uid;
            // Construct a complete snapshot of current shop state
            const shopDataWithId = {
                ...currentShop,
                shortData: {
                    shopName: currentShop.shortData.shopName || '',
                    shopKeeperName: currentShop.shortData.shopKeeperName || '',
                    type: currentShop.shortData.type || '',
                    location: currentShop.shortData.location || ''
                },
                longData: {
                    shopDetails: currentShop.longData.shopDetails || '',
                    shopKeeperDetails: currentShop.longData.shopKeeperDetails || ''
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
                        included: getFilteredArray(traitStates, SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray(traitStates, SELECTION_STATES.EXCLUDE)
                    },
                    currentStock: items
                },
                dateLastEdited: new Date(),
                dateCreated: currentShop.dateCreated || new Date()
            };

            const shopId = await saveOrUpdateShopData(userId, shopDataWithId);
            
            // Update the current shop with the new ID
            setCurrentShop(prevDetails => ({
                ...prevDetails,
                id: shopId
            }));

            // Refresh the shops list
            await loadShops();
            
            console.log('Shop saved with ID:', shopId);
            alert('Shop saved successfully!');
        } catch (error) {
            console.error('Error saving shop:', error);
            alert('Error saving shop. Please try again.');
        }
    };

    /**
     * Loads all shops for the current user from Firebase
     * Called on component mount and after successful saves
     */
    const loadShops = async () => {
        try {
            const userId = currentUser.uid;
            const shops = await loadShopData(userId);
            setSavedShops(shops);
        } catch (error) {
            console.error('Error loading shops:', error);
        }
    };

    /**
     * Handles loading a specific shop's data
     * This is the central point for restoring all shop state
     * Called when a user selects a shop from the saved shops list
     */
    const handleLoadShop = (shop) => {
        console.log('Loading shop:', shop);
        // Update all state variables from the loaded shop
        setCurrentShop(shop);
        setCurrentGold(shop.parameters.goldAmount || 0);
        setLowestLevel(shop.parameters.levelLow || 0);
        setHighestLevel(shop.parameters.levelHigh || 10);
        setItemBias(shop.parameters.shopBias || { x: 0.5, y: 0.5 });
        setRarityDistribution(shop.parameters.rarityDistribution || {
            Common: 95.00,
            Uncommon: 4.50,
            Rare: 0.49,
            Unique: 0.01
        });
        setItems(shop.parameters.currentStock || []);

        // Restore filter states from saved data
        const categoryMap = new Map();
        shop.parameters.categories?.included?.forEach(category => 
            categoryMap.set(category, SELECTION_STATES.INCLUDE)
        );
        shop.parameters.categories?.excluded?.forEach(category => 
            categoryMap.set(category, SELECTION_STATES.EXCLUDE)
        );
        setCategoryStates(categoryMap);

        const subcategoryMap = new Map();
        shop.parameters.subcategories?.included?.forEach(subcategory => 
            subcategoryMap.set(subcategory, SELECTION_STATES.INCLUDE)
        );
        shop.parameters.subcategories?.excluded?.forEach(subcategory => 
            subcategoryMap.set(subcategory, SELECTION_STATES.EXCLUDE)
        );
        setSubcategoryStates(subcategoryMap);

        const traitMap = new Map();
        shop.parameters.traits?.included?.forEach(trait => 
            traitMap.set(trait, SELECTION_STATES.INCLUDE)
        );
        shop.parameters.traits?.excluded?.forEach(trait => 
            traitMap.set(trait, SELECTION_STATES.EXCLUDE)
        );
        setTraitStates(traitMap);
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
                        .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                        .map(([trait]) => trait),
                    excluded: Array.from((traitStates || new Map()).entries())
                        .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
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

    // Function to handle creating a new shop
    const handleNewShop = () => {
        // Reset all state to initial values
        setCurrentShop(shopData);
        setCurrentGold(0);
        setLowestLevel(0);
        setHighestLevel(10);
        setItemBias({ x: 0.5, y: 0.5 });
        setRarityDistribution({
            Common: 95.00,
            Uncommon: 4.50,
            Rare: 0.49,
            Unique: 0.01
        });
        setItems([]);

        // Clear all filters
        setCategoryStates(new Map());
        setSubcategoryStates(new Map());
        setTraitStates(new Map());
    };

    if (loading) {
        return <div className="content-area">Loading...</div>;
    }

    return (
        <div className="content-area">
            <div className="content-container">
                {/* Left sidebar contains all shop generation parameters */}
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
                
                {/* Middle section displays the generated inventory */}
                <MiddleBar>
                    <ItemTable
                        items={items}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        currentShop={currentShop.shortData.shopName || 'Unnamed Shop'}
                    />
                </MiddleBar>
                
                {/* Right sidebar handles shop metadata and persistence */}
                <RightSidebar 
                    onSave={handleSaveShop}
                    savedShops={savedShops}
                    currentShop={currentShop}
                    onShopDetailsChange={handleShopDetailsChange}
                    onLoadShop={handleLoadShop}
                    onNewShop={handleNewShop}
                />
            </div>
        </div>
    );
}

export default ShopGenerator; 

