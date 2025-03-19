import React, { useRef, useEffect, useMemo } from "react";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useItemData } from "../../../context/itemData";
import "./ShopGenerator.css";
import TabContainer from "./shared/tab/TabContainer";
import { useSorting } from "./utils/sortingUtils";
import defaultShopData from "./utils/shopData";
import { useShopOperations } from "./hooks/useShopOperations";
import { useShopState } from "./hooks/useShopState";
import { useShopFilters } from "./hooks/useShopFilters";
import { useShopSnapshot } from "./hooks/useShopSnapshot";
import { useTabManagement } from "./hooks/useTabManagement";
import { useInventoryGeneration } from "./hooks/useInventoryGeneration";
import { TAB_TYPE_IDENTIFIERS, DEFAULT_TAB_STATE, TAB_TYPES } from "./utils/tabConstants";
import { useTabRegistry } from './hooks/useTabRegistry';
import { shouldRefreshCache, setLastRefreshTimestamp, clearShopCache } from './utils/shopCacheUtils';
import { debug } from '../../../utils/debugUtils';

const STORAGE_KEY = "tabGroupsState";

/**
 * Validates if the state has a valid structure and tab types
 * @param {string|object} state - The state to validate (either stringified or object)
 * @returns {object|null} - The parsed/validated state if valid, null if invalid
 */
const isValidSavedState = (state) => {
    if (!state) return null;

    try {
        // Parse the state if it's a string, otherwise use the state
        const parsedState = typeof state === 'string' ? JSON.parse(state) : state;
        return parsedState &&
            Array.isArray(parsedState.groups) &&
            Array.isArray(parsedState.widths) &&
            parsedState.groups.every(
                (group) =>
                    Array.isArray(group) &&
                    group.every(
                        (tab) =>
                            tab &&
                            typeof tab === "object" &&
                            typeof tab.type === "string" &&
                            typeof tab.key === "string" &&
                            Object.values(TAB_TYPE_IDENTIFIERS).includes(tab.type)
                    )
            )
            ? parsedState
            : null;
    } catch {
        return null;
    }
};

// Add this outside the component
const createInitialTabState = () => {
    try {
        // localStorage.clear();
        const savedState = localStorage.getItem(STORAGE_KEY);
        const validState = isValidSavedState(savedState);
        if (!validState) {
            return DEFAULT_TAB_STATE;
        }
        return validState;
    } catch (error) {
        debug("initialization", "Error loading saved tab state", error);
        return DEFAULT_TAB_STATE;
    }
};

// Move tab structure creation outside the component
const createTabElements = (tabStructure) => {
    const processGroups = (groups) => {
        return groups.map(group => 
            group.map(tab => {
                const TabComponent = TAB_TYPES[tab.type];
                if (!TabComponent) return null;
                
                return {
                    key: tab.key,
                    type: { 
                        name: tab.type,
                        component: TabComponent,  // Store the actual component reference
                        minWidth: TabComponent.minWidth || 200,
                        displayName: TabComponent.displayName  // Add the displayName property
                    },
                    Component: TabComponent
                };
            }).filter(Boolean)
        ).filter(group => group.length > 0);
    };

    return processGroups(tabStructure.groups);
};

function ShopGenerator() {
    debug("initialization", "Component render start");
    const { currentUser, loading: authLoading } = useAuth();
    const { items: allItems, categoryData, loading: itemsLoading, error: itemsError } = useItemData();
    const [savedShops, setSavedShops] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [isStateReady, setIsStateReady] = useState(false);
    const previousUser = useRef(null);

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

    // Snapshot and change tracking
    const { shopSnapshot, setShopSnapshot, getChangedFields, hasUnsavedChanges } = useShopSnapshot({
        shopState,
        filterMaps,
        inventory,
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

    // Sorting state
    const { sortedItems, sortConfig, handleSort } = useSorting(inventory);

    // Add the tab registry before any tab-related logic
    const tabRegistry = useTabRegistry({
        shopState,
        setShopState,
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleRarityDistributionChange,
        handleBiasChange,
        categoryData,
        filterMaps,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections,
        sortedItems,
        sortConfig,
        handleSort,
        generateInventory,
        isGenerating,
        handleShopDetailsChange,
        handleSaveShop,
        handleCloneShop,
        handleDeleteShop,
        handleRevertChanges,
        savedShops,
        hasUnsavedChanges,
        getChangedFields,
        handleLoadShop,
        handleNewShop,
        setFilterMaps,
        inventory,
        setInventory,
        shopSnapshot
    });

    // Initialize shop - either from saved state or create new
    const hasInitialized = useRef(false);
    useEffect(() => {
        const initId = Date.now().toString(36);
        debug("initialization", `[Init ${initId}] 🚀 Starting initialization check`);

        // Don't do anything while loading
        if (authLoading || itemsLoading) {
            debug("initialization", `[Init ${initId}] ⏳ Still loading:`, { authLoading, itemsLoading });
            return;
        }

        // Prevent multiple initializations
        if (hasInitialized.current) {
            debug("initialization", `[Init ${initId}] ✋ Already initialized`);
            return;
        }

        const initializeState = async () => {
            try {
                debug("initialization", `[Init ${initId}] 🔄 Starting state initialization`);

                // Initialize filter maps if they're empty
                if (!filterMaps?.categories) {
                    debug("initialization", `[Init ${initId}] 📋 Creating initial filter maps`);
                    setFilterMaps({
                        categories: new Map(),
                        subcategories: new Map(),
                        traits: new Map(),
                    });
                }

                // If user is logged in, first load their shop list
                if (currentUser && !savedShops.length) {
                    debug("initialization", `[Init ${initId}] 📥 Loading shop list for user`);
                    await handleLoadShopList();
                    
                    // After loading shop list, load the first shop if available
                    if (savedShops && savedShops.length > 0) {
                        debug("initialization", `[Init ${initId}] 📥 Loading first shop`);
                        await handleLoadShop(savedShops[0]);
                    } else {
                        debug("initialization", `[Init ${initId}] ➕ No saved shops, creating new one`);
                        await handleNewShop();
                    }
                }
                // Only create new shop if we don't have one and aren't logged in
                else if (!shopState?.id && !currentUser) {
                    debug("initialization", `[Init ${initId}] ➕ Creating new anonymous shop`);
                    await handleNewShop();
                }

                debug("initialization", `[Init ${initId}] √ Initialization complete`);
                hasInitialized.current = true;
                setIsStateReady(true);
            } catch (error) {
                debug("initialization", `[Init ${initId}] ❌ Initialization error:`, error);
                hasInitialized.current = false;
            }
        };

        initializeState();
    }, [
        authLoading,
        itemsLoading,
        currentUser,
        shopState?.id,
        savedShops,
        handleLoadShopList,
        handleLoadShop,
        handleNewShop,
        filterMaps,
        setFilterMaps,
    ]);

    // Handle login-triggered refresh with cooldown
    useEffect(() => {
        // Skip if still loading or no user
        if (authLoading || !currentUser) {
            previousUser.current = null;
            return;
        }

        // Skip if same user (not a login event)
        if (previousUser.current === currentUser.uid) {
            return;
        }

        const refreshOnLogin = async () => {
            try {
                debug("shopGenerator", "User logged in, checking if refresh needed");
                
                // Clear cache on user change (different user logged in)
                if (previousUser.current && previousUser.current !== currentUser.uid) {
                    debug("shopGenerator", "Different user logged in, clearing previous cache");
                    clearShopCache(previousUser.current);
                }
                
                // Check cooldown before refreshing
                if (shouldRefreshCache(currentUser.uid, 60)) {
                    debug("shopGenerator", "Refreshing shop list after login");
                    await handleLoadShopList();
                    setLastRefreshTimestamp(currentUser.uid);
                } else {
                    debug("shopGenerator", "Skipping refresh due to cooldown");
                }
                
                // Update previous user reference
                previousUser.current = currentUser.uid;
            } catch (error) {
                debug("shopGenerator", "Error refreshing after login", error);
            }
        };

        refreshOnLogin();
    }, [currentUser, authLoading, handleLoadShopList]);

    // Replace getInitialTabState with a memoized structure that never changes
    const tabStructure = useMemo(() => createInitialTabState(), []);

    // Create the tab elements with current props - this only depends on the static tab structure
    const tabElements = useMemo(() => createTabElements(tabStructure), [tabStructure]);

    // Tab management with the new structure
    const {
        tabGroups,
        flexBasis,
        isResizing,
        draggedTab,
        draggedTabIndex,
        sourceGroupIndex,
        handleTabMove,
        tabContainerProps
    } = useTabManagement({
        initialTabGroups: tabElements,
        initialGroupWidths: tabStructure.widths
    });

    // Save state whenever tab groups or widths change
    useEffect(() => {
        const saveState = () => {
            debug("stateSync", "Saving tab state, current groups:", tabGroups);

            // Extract the original tab type identifiers before they become React elements
            const groupsData = tabGroups.map((group) =>
                group.map((tab) => {
                    // Find the matching tab type by comparing the actual component or its display name
                    const matchingType = Object.keys(TAB_TYPES).find(
                        (type) =>
                            TAB_TYPES[type] === tab.type || // Check direct component match
                            TAB_TYPES[type].displayName === tab.type.displayName // Check display name match
                    );

                    if (!matchingType) {
                        debug("stateSync", "Could not find matching tab type for:", tab);
                    }

                    return {
                        type: matchingType || tab.type.name,
                        key: tab.key,
                    };
                })
            );

            const stateToSave = {
                groups: groupsData,
                widths: flexBasis,
            };

            debug("stateSync", "Validating state before save:", stateToSave);
            const validState = isValidSavedState(stateToSave);
            
            if (!validState) {
                debug("stateSync", "Invalid state, skipping save");
                return;
            }

            debug("stateSync", "Saving state to localStorage:", validState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validState));
        };

        saveState();
    }, [tabGroups, flexBasis]);

    // Show loading state while initializing
    if (!isStateReady || itemsLoading || authLoading) {
        debug("initialization", "⏳ Showing loading state:", {
            isStateReady,
            itemsLoading,
            authLoading,
        });
        return <div>Loading...</div>;
    }

    // Show error state if items failed to load
    if (itemsError) {
        debug("initialization", "❌ Showing error state:", itemsError);
        return <div>Error loading item data: {itemsError}</div>;
    }

    debug("initialization", "√ Rendering main component");

    return (
        <div className={`shop-generator ${isResizing ? "resizing" : ""}`}>
            {tabGroups.map((tabs, index) => (
                <TabContainer
                    key={index}
                    groupIndex={index}
                    tabs={tabs.map((tab) => {
                        const registryEntry = tabRegistry[tab.type.name];
                        if (!registryEntry) return null;
                        
                        const TabComponent = tab.type.component || tab.Component;
                        if (!TabComponent) return null;

                        // Create element with memoized props from registry
                        return React.createElement(TabComponent, {
                            key: tab.key,
                            type: tab.type,
                            ...registryEntry.getProps()
                        });
                    })}
                    draggedTab={draggedTab}
                    draggedTabIndex={draggedTabIndex}
                    isLastGroup={index === tabGroups.length - 1}
                    isFirstGroup={index === 0}
                    style={{ width: flexBasis[index] || `${100 / tabGroups.length}%` }}
                    onTabMove={(newTabs) => {
                        if (Array.isArray(newTabs) && newTabs.length === 2 && typeof newTabs[1] === "number") {
                            handleTabMove(newTabs, sourceGroupIndex, index);
                        } else {
                            handleTabMove(newTabs, index);
                        }
                    }}
                    {...tabContainerProps}
                />
            ))}
        </div>
    );
}

export default ShopGenerator;
