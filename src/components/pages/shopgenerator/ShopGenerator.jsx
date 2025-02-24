import React, { useRef, useEffect } from "react";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useItemData } from "../../../context/itemData";
import "./ShopGenerator.css";
import TabContainer from "./shared/tab/TabContainer";
import Tab_Parameters from "./tabs/tab_parameters/Tab_Parameters";
import Tab_InventoryTable from "./tabs/tab_inventorytable/Tab_InventoryTable";
import Tab_ChooseShop from "./tabs/tab_chooseshop/Tab_ChooseShop";
import Tab_ShopDetails from "./tabs/tab_shopdetails/Tab_ShopDetails";
import Tab_AiAssistant from "./tabs/tab_aiassistant/Tab_AiAssistant";
import { useSorting } from "./utils/sortingUtils";
import defaultShopData from "./utils/shopData";
import { useShopOperations } from "./hooks/useShopOperations";
import { useShopState } from "./hooks/useShopState";
import { useShopFilters } from "./hooks/useShopFilters";
import { useShopSnapshot } from "./hooks/useShopSnapshot";
import { useTabManagement } from './hooks/useTabManagement';
import { useInventoryGeneration } from "./hooks/useInventoryGeneration";

// Debug configuration
const DEBUG_CONFIG = {
    enabled: false, // Master debug switch
    areas: {
        initialization: false,
        tabManagement: false,
        stateSync: false,
        tabCreation: false
    }
};

// Debug logger
const debug = (area, message, data = '') => {
    if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.areas[area]) return;
    const timestamp = performance.now().toFixed(2);
    const prefix = {
        initialization: '🚀 [Init]',
        tabManagement: '📑 [Tabs]',
        stateSync: '🔄 [Sync]',
        tabCreation: '🏗️ [Create]'
    }[area] || '🔧 [Debug]';
    
    console.log(`${prefix} [${timestamp}ms] ${message}`, data ? data : '');
};

/**
 * ShopGenerator Component
 *
 * Main component for the shop generation system. Manages the overall state and coordinates
 * between different features through custom hooks.
 *
 * Features:
 * 1. Shop Management
 *    - Create, load, save, and delete shops
 *    - Track unsaved changes
 *    - Maintain shop snapshots for state restoration
 *
 * 2. Inventory Generation
 *    - Generate shop inventory based on parameters
 *    - Filter by categories, subcategories, and traits
 *    - Sort and display inventory items
 *
 * 3. Tab System
 *    - Draggable and resizable tab groups
 *    - Persistent tab layout saved to localStorage
 *    - Tab types:
 *      - Parameters: Shop generation settings
 *      - Inventory Table: View and generate inventory
 *      - Choose Shop: Load and manage saved shops
 *      - Shop Details: Edit shop information
 *      - AI Assistant: AI-powered shop assistance
 *
 * State Management:
 * - Uses custom hooks for specific features:
 *   - useShopState: Shop parameters and details
 *   - useShopFilters: Category and trait filtering
 *   - useShopSnapshot: Change tracking and state restoration
 *   - useShopOperations: Shop CRUD operations
 *   - useInventoryGeneration: Inventory generation logic
 *   - useTabManagement: Tab layout and interactions
 *
 * @component
 */

// Constants for tab types that won't be minified
const TAB_TYPE_IDENTIFIERS = {
    PARAMETERS: "Tab_Parameters",
    INVENTORY: "Tab_InventoryTable",
    CHOOSE_SHOP: "Tab_ChooseShop",
    SHOP_DETAILS: "Tab_ShopDetails",
    AI_ASSISTANT: "Tab_AiAssistant"
};

// Add a mapping of valid tab types
const TAB_TYPES = {
    [TAB_TYPE_IDENTIFIERS.PARAMETERS]: Tab_Parameters,
    [TAB_TYPE_IDENTIFIERS.INVENTORY]: Tab_InventoryTable,
    [TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP]: Tab_ChooseShop,
    [TAB_TYPE_IDENTIFIERS.SHOP_DETAILS]: Tab_ShopDetails,
    [TAB_TYPE_IDENTIFIERS.AI_ASSISTANT]: Tab_AiAssistant
};

// Default tab configuration
const DEFAULT_TAB_STATE = {
    groups: [
        [
            { type: "Tab_Parameters", key: "Tab_Parameters-0" },
            { type: "Tab_InventoryTable", key: "Tab_InventoryTable-0" },
            { type: "Tab_ChooseShop", key: "Tab_ChooseShop-0" },
            { type: "Tab_ShopDetails", key: "Tab_ShopDetails-0" },
            { type: "Tab_AiAssistant", key: "Tab_AiAssistant-0" }
        ]
    ],
    widths: ["100%"]
};

function ShopGenerator() {
    debug('initialization', 'Component render start');
    const { currentUser, isLoading: authLoading } = useAuth();
    const { items: allItems, categoryData, loading: itemsLoading, error: itemsError } = useItemData();
    const [savedShops, setSavedShops] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [isStateReady, setIsStateReady] = useState(false);

    // Filter groups state management first
    const {
        filterMaps,
        setFilterMaps,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections,
        getFilteredArray,
    } = useShopFilters();

    // Initialize base shop state
    const {
        shopState,
        setShopState,
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleBiasChange,
        handleRarityDistributionChange,
        handleShopDetailsChange,
        handleRevertChanges,
    } = useShopState(defaultShopData);

    // Sorting state
    const { sortedItems, sortConfig, handleSort } = useSorting(inventory);

    // Helper to create a proper React element for a tab with type checking
    const createTabElement = (tabType, key) => {
        debug('tabCreation', 'Creating tab element:', { tabType, key });
        
        // Validate tab type is one of our known types
        if (!tabType || !TAB_TYPES[tabType]) {
            debug('tabCreation', 'Invalid or unknown tab type:', tabType);
            return null;
        }

        const TabComponent = TAB_TYPES[tabType];

        // Create base props that all tabs need
        const baseProps = {
            key,
            type: { name: tabType, minWidth: TabComponent.minWidth || 200 }
        };

        // Add specific props based on tab type
        let specificProps = {};
        switch (tabType) {
            case "Tab_Parameters":
                specificProps = {
                    currentGold: shopState.gold,
                    setCurrentGold: handleGoldChange,
                    lowestLevel: shopState.levelRange.min,
                    setLowestLevel: handleLowestLevelChange,
                    highestLevel: shopState.levelRange.max,
                    setHighestLevel: handleHighestLevelChange,
                    rarityDistribution: shopState.rarityDistribution,
                    setRarityDistribution: handleRarityDistributionChange,
                    itemBias: shopState.itemBias,
                    setItemBias: handleBiasChange,
                    categoryData: categoryData || {},
                    categoryStates: filterMaps?.categories || new Map(),
                    getFilterState: getFilterState || (() => {}),
                    toggleCategory: toggleCategory || (() => {}),
                    toggleSubcategory: toggleSubcategory || (() => {}),
                    toggleTrait: toggleTrait || (() => {}),
                    clearCategorySelections: clearCategorySelections || (() => {}),
                    clearSubcategorySelections: clearSubcategorySelections || (() => {}),
                    clearTraitSelections: clearTraitSelections || (() => {})
                };
                break;
            case "Tab_InventoryTable":
                specificProps = {
                    items: sortedItems || [],
                    sortConfig: sortConfig || [],
                    onSort: handleSort || (() => {}),
                    currentShopName: shopState.name || "",
                    handleGenerateClick: () => {},
                    isGenerating: false
                };
                break;
            case "Tab_ChooseShop":
                specificProps = {
                    savedShops: savedShops || [],
                    onLoadShop: () => {},
                    onNewShop: () => {},
                    currentShopId: shopState.id || null
                };
                break;
            case "Tab_ShopDetails":
                specificProps = {
                    shopState: shopState || defaultShopData,
                    onShopDetailsChange: () => {},
                    onSaveShop: () => {},
                    onCloneShop: () => {},
                    onDeleteShop: () => {},
                    onRevertChanges: () => {},
                    savedShops: savedShops || [],
                    hasUnsavedChanges: false,
                    changes: { basic: {}, parameters: {}, hasInventoryChanged: false }
                };
                break;
            case "Tab_AiAssistant":
                specificProps = {
                    currentShop: {
                        id: shopState.id || "",
                        name: shopState.name || "",
                        keeperName: shopState.keeperName || "",
                        type: shopState.type || "",
                        location: shopState.location || "",
                        description: shopState.description || "",
                        keeperDescription: shopState.keeperDescription || "",
                        dateCreated: shopState.dateCreated || new Date(),
                        dateLastEdited: shopState.dateLastEdited || new Date()
                    },
                    onAiAssistantChange: () => {}
                };
                break;
        }

        return React.createElement(TabComponent, { ...baseProps, ...specificProps });
    };

    // Pre-compute the default tab configuration
    const DEFAULT_TAB_CONFIG = (() => {
        const processedGroups = DEFAULT_TAB_STATE.groups.map(group => 
            group.map(tab => createTabElement(tab.type, tab.key))
            .filter(Boolean)
        ).filter(group => group.length > 0);

        return {
            groups: processedGroups,
            widths: DEFAULT_TAB_STATE.widths
        };
    })();

    // Tab management with built-in persistence
    const {
        tabGroups,
        flexBasis,
        isResizing,
        draggedTab,
        draggedTabIndex,
        sourceGroupIndex,
        dropIndicators,
        handleTabMove,
        handleTabSplit,
        handleResize,
        handleDragStart,
        handleDragEnd,
        handleDropIndicatorChange,
        setTabGroups,
        setFlexBasis,
    } = useTabManagement(DEFAULT_TAB_CONFIG, createTabElement);

    // Remove the old tabState and its effects

    debug('initialization', '📊 Initial hooks loaded:', {
        authLoading,
        itemsLoading,
        hasUser: !!currentUser,
        hasItems: !!allItems
    });

    // Snapshot and change tracking
    const { shopSnapshot, setShopSnapshot, getChangedFields, hasUnsavedChanges } = useShopSnapshot({
        shopState,
        filterMaps,
        inventory,
    });

    // Shop operations
    const { handleLoadShopList, handleLoadShop, handleNewShop, handleCloneShop, handleSaveShop, handleDeleteShop } =
        useShopOperations({
            currentUser,
            shopState,
            setShopState,
            filterMaps,
            inventory,
            setInventory,
            setShopSnapshot,
            setSavedShops,
            setFilterMaps,
            getFilteredArray,
            hasUnsavedChanges,
        });

    // Shop generation
    const { generateInventory, isGenerating } = useInventoryGeneration({
        allItems,
        shopState,
        filterMaps,
        getFilteredArray,
        setInventory,
        setShopSnapshot,
    });

    const handleGenerateClick = () => {
        generateInventory();
    };

    // Initialize shop - either from saved state or create new
    const hasInitialized = useRef(false);
    useEffect(() => {
        const initId = Date.now().toString(36);
        debug('initialization', `[Init ${initId}] 🚀 Starting initialization check`);
        
        // Don't do anything while loading
        if (authLoading || itemsLoading) {
            debug('initialization', `[Init ${initId}] ⏳ Still loading:`, { authLoading, itemsLoading });
            return;
        }

        // Prevent multiple initializations
        if (hasInitialized.current) {
            debug('initialization', `[Init ${initId}] ✋ Already initialized`);
            return;
        }

        const initializeState = async () => {
            try {
                debug('initialization', `[Init ${initId}] 🔄 Starting state initialization`);

                // Initialize filter maps if they're empty
                if (!filterMaps?.categories) {
                    debug('initialization', `[Init ${initId}] 📋 Creating initial filter maps`);
                    setFilterMaps({
                        categories: new Map(),
                        subcategories: new Map(),
                        traits: new Map()
                    });
                }

                // If user is logged in, first load their shop list
                if (currentUser && !savedShops.length) {
                    debug('initialization', `[Init ${initId}] 📥 Loading shop list for user`);
                    await handleLoadShopList();
                }
                // Only create new shop if we don't have one and aren't logged in
                else if (!shopState?.id && !currentUser) {
                    debug('initialization', `[Init ${initId}] ➕ Creating new anonymous shop`);
                    await handleNewShop();
                }

                debug('initialization', `[Init ${initId}] ✅ Initialization complete`);
                hasInitialized.current = true;
                setIsStateReady(true);
            } catch (error) {
                debug('initialization', `[Init ${initId}] ❌ Initialization error:`, error);
                hasInitialized.current = false;
            }
        };

        initializeState();
    }, [authLoading, itemsLoading, currentUser, shopState?.id, savedShops, handleLoadShopList, handleNewShop, filterMaps, setFilterMaps]);

    // Sync tabState changes to tabGroups
    useEffect(() => {
        debug('stateSync', 'Syncing tab state to groups:', tabGroups);
        setTabGroups(tabGroups);
        setFlexBasis(flexBasis);
    }, [tabGroups, flexBasis]);

    // Show loading state while initializing
    if (!isStateReady || itemsLoading || authLoading) {
        debug('initialization', '⏳ Showing loading state:', {
            isStateReady,
            itemsLoading,
            authLoading
        });
        return <div>Loading...</div>;
    }

    // Show error state if items failed to load
    if (itemsError) {
        debug('initialization', '❌ Showing error state:', itemsError);
        return <div>Error loading item data: {itemsError}</div>;
    }

    debug('initialization', '✅ Rendering main component');

    const handleAiAssistantChange = (newState) => {
        debug('initialization', "Ai Assistant state updated:", newState);
    };

    return (
        <div className={`shop-generator ${isResizing ? "resizing" : ""}`}>
            {tabGroups.map((tabs, index) => (
                <TabContainer
                    key={index}
                    groupIndex={index}
                    tabs={tabs.map((tab) => {
                        // Add props based on tab type
                        switch (tab.type.name) {
                            case "Tab_Parameters":
                                return React.cloneElement(tab, {
                                    currentGold: shopState.gold,
                                    setCurrentGold: handleGoldChange,
                                    lowestLevel: shopState.levelRange.min,
                                    setLowestLevel: handleLowestLevelChange,
                                    highestLevel: shopState.levelRange.max,
                                    setHighestLevel: handleHighestLevelChange,
                                    rarityDistribution: shopState.rarityDistribution,
                                    setRarityDistribution: handleRarityDistributionChange,
                                    itemBias: shopState.itemBias,
                                    setItemBias: handleBiasChange,
                                    categoryData: categoryData,
                                    categoryStates: filterMaps.categories,
                                    subcategoryStates: filterMaps.subcategories,
                                    traitStates: filterMaps.traits,
                                    getFilterState: getFilterState,
                                    toggleCategory: toggleCategory,
                                    toggleSubcategory: toggleSubcategory,
                                    toggleTrait: toggleTrait,
                                    clearCategorySelections: clearCategorySelections,
                                    clearSubcategorySelections: clearSubcategorySelections,
                                    clearTraitSelections: clearTraitSelections,
                                });
                            case "Tab_InventoryTable":
                                return React.cloneElement(tab, {
                                    items: sortedItems,
                                    sortConfig,
                                    onSort: handleSort,
                                    currentShopName: shopState.name,
                                    handleGenerateClick,
                                    isGenerating,
                                });
                            case "Tab_ShopDetails":
                                return React.cloneElement(tab, {
                                    shopState,
                                    onShopDetailsChange: handleShopDetailsChange,
                                    onSaveShop: handleSaveShop,
                                    onCloneShop: handleCloneShop,
                                    onDeleteShop: handleDeleteShop,
                                    onRevertChanges: () =>
                                        handleRevertChanges(shopSnapshot, setFilterMaps, setInventory),
                                    savedShops,
                                    hasUnsavedChanges,
                                    changes: getChangedFields(),
                                });
                            case "Tab_ChooseShop":
                                return React.cloneElement(tab, {
                                    savedShops,
                                    onLoadShop: handleLoadShop,
                                    onNewShop: handleNewShop,
                                    currentShopId: shopState.id,
                                });
                            case "Tab_AiAssistant":
                                return React.cloneElement(tab, {
                                    currentShop: {
                                        id: shopState.id,
                                        name: shopState.name,
                                        keeperName: shopState.keeperName,
                                        type: shopState.type,
                                        location: shopState.location,
                                        description: shopState.description,
                                        keeperDescription: shopState.keeperDescription,
                                        dateCreated: shopState.dateCreated,
                                        dateLastEdited: shopState.dateLastEdited,
                                    },
                                    onAiAssistantChange: handleAiAssistantChange,
                                });
                            default:
                                return tab;
                        }
                    })}
                    draggedTab={draggedTab}
                    draggedTabIndex={draggedTabIndex}
                    sourceGroupIndex={sourceGroupIndex}
                    dropIndicators={dropIndicators}
                    isLastGroup={index === tabGroups.length - 1}
                    onResize={handleResize}
                    style={{ width: flexBasis[index] || `${100 / tabGroups.length}%` }}
                    onDragStart={(tab, tabIndex) => handleDragStart(tab, tabIndex, index)}
                    onDragEnd={handleDragEnd}
                    onDropIndicatorChange={handleDropIndicatorChange}
                    onTabMove={(newTabs) => {
                        if (Array.isArray(newTabs) && newTabs.length === 2 && typeof newTabs[1] === "number") {
                            handleTabMove(newTabs, sourceGroupIndex, index);
                        } else {
                            handleTabMove(newTabs, index);
                        }
                    }}
                    onTabClick={() => {}}
                    onTabSplit={handleTabSplit}
                />
            ))}
        </div>
    );
}

export default ShopGenerator;
