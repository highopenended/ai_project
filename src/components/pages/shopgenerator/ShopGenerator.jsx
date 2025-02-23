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
import { useTabManagement } from "./hooks/useTabManagement";
import { useInventoryGeneration } from "./hooks/useInventoryGeneration";

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

const STORAGE_KEY = "tabGroupsState";

// Constants for tab types that won't be minified
const TAB_TYPE_IDENTIFIERS = {
    PARAMETERS: "Tab_Parameters",
    INVENTORY: "Tab_InventoryTable",
    CHOOSE_SHOP: "Tab_ChooseShop",
    SHOP_DETAILS: "Tab_ShopDetails",
    AI_ASSISTANT: "Tab_AiAssistant"
};

const DEFAULT_TAB_STATE = {
    groups: [
        [
            { type: TAB_TYPE_IDENTIFIERS.PARAMETERS, key: "Tab_Parameters-0" },
            { type: TAB_TYPE_IDENTIFIERS.INVENTORY, key: "Tab_InventoryTable-0" },
            { type: TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP, key: "Tab_ChooseShop-0" },
            { type: TAB_TYPE_IDENTIFIERS.SHOP_DETAILS, key: "Tab_ShopDetails-0" },
            { type: TAB_TYPE_IDENTIFIERS.AI_ASSISTANT, key: "Tab_AiAssistant-0" }
        ]
    ],
    widths: ["100%"]
};

// Add a mapping of valid tab types
const TAB_TYPES = {
    [TAB_TYPE_IDENTIFIERS.PARAMETERS]: Tab_Parameters,
    [TAB_TYPE_IDENTIFIERS.INVENTORY]: Tab_InventoryTable,
    [TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP]: Tab_ChooseShop,
    [TAB_TYPE_IDENTIFIERS.SHOP_DETAILS]: Tab_ShopDetails,
    [TAB_TYPE_IDENTIFIERS.AI_ASSISTANT]: Tab_AiAssistant
};

function ShopGenerator() {
    console.log('🔄 Component render start');
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
        console.log('Creating tab element:', { tabType, key });
        
        // Validate tab type is one of our known types
        if (!tabType || !TAB_TYPES[tabType]) {
            console.warn('Invalid or unknown tab type:', tabType);
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

    // Transform configuration into React elements
    const createTabsFromConfig = (config) => {
        console.log('Creating tabs from config:', config);
        
        // Ensure we have valid groups and widths
        if (!config.groups || !Array.isArray(config.groups) || !config.widths || !Array.isArray(config.widths)) {
            console.warn('Invalid config structure, using default');
            return DEFAULT_TAB_STATE;
        }

        // Process each group
        const processedGroups = config.groups.map(group => {
            if (!Array.isArray(group)) {
                console.warn('Invalid group structure:', group);
                return [];
            }

            return group.map(tab => {
                // Log the tab type we're trying to create
                console.log('Processing tab:', tab);
                
                // Ensure we're using the correct type identifier
                const tabType = tab.type;
                if (!TAB_TYPES[tabType]) {
                    console.warn('Unknown tab type:', tabType);
                    return null;
                }
                
                return createTabElement(tabType, tab.key);
            }).filter(Boolean);
        }).filter(group => group.length > 0);

        console.log('Processed groups:', processedGroups);
        
        // If no valid groups were created, return default state
        if (processedGroups.length === 0) {
            console.warn('No valid groups created, using default');
            return DEFAULT_TAB_STATE;
        }

        // Ensure we have the correct number of widths
        let widths = config.widths;
        if (widths.length !== processedGroups.length) {
            console.warn('Width count mismatch, recalculating widths');
            widths = processedGroups.map((_, i) => 
                i === processedGroups.length - 1 ? '100%' : `${100 / processedGroups.length}%`
            );
        }

        return {
            groups: processedGroups,
            widths: widths
        };
    };

    // Initialize tab state with all required props
    const [tabState, setTabState] = useState(() => createTabsFromConfig(DEFAULT_TAB_STATE));

    console.log('📊 Initial hooks loaded:', {
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
        console.log(`[Init ${initId}] 🚀 Starting initialization check`);
        
        // Don't do anything while loading
        if (authLoading || itemsLoading) {
            console.log(`[Init ${initId}] ⏳ Still loading:`, { authLoading, itemsLoading });
            return;
        }

        // Prevent multiple initializations
        if (hasInitialized.current) {
            console.log(`[Init ${initId}] ✋ Already initialized`);
            return;
        }

        const initializeState = async () => {
            try {
                console.log(`[Init ${initId}] 🔄 Starting state initialization`);

                // Initialize filter maps if they're empty
                if (!filterMaps?.categories) {
                    console.log(`[Init ${initId}] 📋 Creating initial filter maps`);
                    setFilterMaps({
                        categories: new Map(),
                        subcategories: new Map(),
                        traits: new Map()
                    });
                }

                // If user is logged in, first load their shop list
                if (currentUser && !savedShops.length) {
                    console.log(`[Init ${initId}] 📥 Loading shop list for user`);
                    await handleLoadShopList();
                }
                // Only create new shop if we don't have one and aren't logged in
                else if (!shopState?.id && !currentUser) {
                    console.log(`[Init ${initId}] ➕ Creating new anonymous shop`);
                    await handleNewShop();
                }

                console.log(`[Init ${initId}] ✅ Initialization complete`);
                hasInitialized.current = true;
                setIsStateReady(true);
            } catch (error) {
                console.error(`[Init ${initId}] ❌ Initialization error:`, error);
                hasInitialized.current = false;
            }
        };

        initializeState();
    }, [authLoading, itemsLoading, currentUser, shopState?.id, savedShops, handleLoadShopList, handleNewShop, filterMaps, setFilterMaps]);

    // Modify the tab state loading effect to validate saved data
    useEffect(() => {
        console.log('📂 Loading saved tab state');
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) {
                console.log('📂 No saved state found, using default');
                setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
                return;
            }

            console.log('Raw saved state:', savedState);
            const parsed = JSON.parse(savedState);
            console.log('Parsed saved state:', parsed);

            // Basic structure validation
            if (!parsed || !Array.isArray(parsed.groups) || !Array.isArray(parsed.widths)) {
                console.warn('Invalid saved state structure');
                setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
                return;
            }

            // Validate group structure
            const isValidStructure = parsed.groups.every(group =>
                Array.isArray(group) && group.every(tab =>
                    tab && typeof tab === 'object' && 
                    typeof tab.type === 'string' && 
                    typeof tab.key === 'string'
                )
            );

            if (!isValidStructure) {
                console.warn('Invalid tab structure in saved state');
                setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
                return;
            }

            // Validate tab types
            const hasValidTabs = parsed.groups.every(group =>
                group.every(tab => {
                    const isValid = Object.values(TAB_TYPE_IDENTIFIERS).includes(tab.type);
                    if (!isValid) {
                        console.warn('Invalid tab type:', {
                            type: tab.type,
                            availableTypes: Object.values(TAB_TYPE_IDENTIFIERS)
                        });
                    }
                    return isValid;
                })
            );

            if (!hasValidTabs) {
                console.warn('Invalid tab types in saved state, using default');
                setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
                return;
            }

            // Validate widths
            const hasValidWidths = parsed.widths.every(width => 
                typeof width === 'string' && width.endsWith('%')
            );

            if (!hasValidWidths) {
                console.warn('Invalid widths in saved state');
                parsed.widths = parsed.groups.map((_, i) => 
                    i === parsed.groups.length - 1 ? '100%' : `${100 / parsed.groups.length}%`
                );
            }

            // Create new tab state from validated data
            const newState = createTabsFromConfig(parsed);
            console.log('Created new tab state:', newState);

            if (newState.groups.length > 0) {
                console.log('📂 Setting saved tab state');
                setTabState(newState);
            } else {
                console.warn('No valid groups in new state, using default');
                setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
            }
        } catch (error) {
            console.error('📂 Error loading saved state:', error);
            setTabState(createTabsFromConfig(DEFAULT_TAB_STATE));
        }
    }, []); // Only run once on mount

    // Tab management - now using tabState instead of loadInitialState
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
    } = useTabManagement(tabState.groups, tabState.widths);

    // Sync tabState changes to tabGroups
    useEffect(() => {
        console.log('Syncing tab state to groups:', tabState);
        setTabGroups(tabState.groups);
        setFlexBasis(tabState.widths);
    }, [tabState]);

    // Save state whenever tab groups or widths change
    useEffect(() => {
        const saveState = () => {
            console.log('Saving tab state, current groups:', tabGroups);

            // Extract the original tab type identifiers before they become React elements
            const groupsData = tabGroups.map(group =>
                group.map(tab => {
                    // Find the matching tab type by comparing the actual component or its display name
                    const matchingType = Object.keys(TAB_TYPES).find(type => 
                        TAB_TYPES[type] === tab.type || // Check direct component match
                        TAB_TYPES[type].displayName === tab.type.displayName // Check display name match
                    );

                    if (!matchingType) {
                        console.warn('Could not find matching tab type for:', tab);
                    }

                    return {
                        type: matchingType || tab.type.name,
                        key: tab.key
                    };
                })
            );

            console.log('Processed tab data for saving:', groupsData);

            // Validate all types are known identifiers
            const hasValidTypes = groupsData.every(group =>
                group.every(tab => {
                    const isValid = Object.values(TAB_TYPE_IDENTIFIERS).includes(tab.type);
                    if (!isValid) {
                        console.warn('Invalid tab type found:', {
                            type: tab.type,
                            validTypes: Object.values(TAB_TYPE_IDENTIFIERS)
                        });
                    }
                    return isValid;
                })
            );

            if (!hasValidTypes) {
                console.warn('Attempting to save invalid tab types, skipping save');
                return;
            }

            const stateToSave = {
                groups: groupsData,
                widths: flexBasis,
            };

            console.log('Saving state to localStorage:', stateToSave);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        };

        saveState();
    }, [tabGroups, flexBasis]);

    // Show loading state while initializing
    if (!isStateReady || itemsLoading || authLoading) {
        console.log('⏳ Showing loading state:', {
            isStateReady,
            itemsLoading,
            authLoading
        });
        return <div>Loading...</div>;
    }

    // Show error state if items failed to load
    if (itemsError) {
        console.log('❌ Showing error state:', itemsError);
        return <div>Error loading item data: {itemsError}</div>;
    }

    console.log('✅ Rendering main component');

    const handleAiAssistantChange = (newState) => {
        console.log("Ai Assistant state updated:", newState);
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
