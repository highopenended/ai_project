import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./ShopGenerator.css";
import TabContainer from "./shared/tab/TabContainer";
import Tab_Parameters from "./tabs/tab_parameters/Tab_Parameters";
import Tab_InventoryTable from "./tabs/tab_inventorytable/Tab_InventoryTable";
import Tab_ChooseShop from "./tabs/tab_chooseshop/Tab_ChooseShop";
import Tab_ShopDetails from "./tabs/tab_shopdetails/Tab_ShopDetails";
import Tab_AiAssistant from "./tabs/tab_aiassistant/Tab_AiAssistant";
import itemData from "../../../../public/item-table.json";
import { SELECTION_STATES } from "./utils/shopGeneratorConstants";
import { generateShopInventory } from "./utils/generateShopInventory";
import UnsavedChangesDialogue from "./shared/UnsavedChangesDialogue";
import { useSorting } from "./utils/sortingUtils";
import { extractUniqueCategories } from "./utils/categoryUtils";
import defaultShopData from "./utils/shopData";
import { takeShopSnapshot } from "./utils/shopStateUtils";
import { useShopOperations } from "./hooks/useShopOperations";
import { useShopState } from "./hooks/useShopState";
import { useShopFilters } from "./hooks/useShopFilters";
import { useShopSnapshot } from "./hooks/useShopSnapshot";
import { useTabManagement } from "./hooks/useTabManagement";

/**
 * ShopGenerator Component
 * Parent component that manages multiple tab groups with drag and drop functionality
 *
 * State Management:
 * - tabGroups: 2D array where each inner array represents a group of tabs
 * - draggedTab: Currently dragged tab component
 * - draggedTabIndex: Index of dragged tab in its group
 * - sourceGroupIndex: Index of the group where drag started
 * - dropIndicators: Visual indicators for group splitting
 *
 * Key Behaviors:
 * 1. Tab Movement:
 *    - Within same group: Reorders tabs
 *    - Between groups: Moves tab to new group
 *    - To edges: Creates new groups
 *
 * 2. State Updates:
 *    - Uses setTimeout to ensure clean state transitions
 *    - Resets drag states before updating groups
 *    - Maintains group integrity during operations
 *
 * Common Issues & Solutions:
 * 1. Double drag required: Check state reset timing
 * 2. Groups not updating: Verify setTimeout execution
 * 3. Tab duplication: Check key generation
 * 4. State sync issues: Verify parent-child prop flow
 */

const STORAGE_KEY = "tabGroupsState";

const DEFAULT_TAB_STATE = {
    groups: [
        [
            { type: "Tab_Parameters", key: "Tab_Parameters-0" },
            { type: "Tab_InventoryTable", key: "Tab_InventoryTable-0" },
            { type: "Tab_ChooseShop", key: "Tab_ChooseShop-0" },
            { type: "Tab_ShopDetails", key: "Tab_ShopDetails-0" },
            { type: "Tab_AiAssistant", key: "Tab_AiAssistant-0" },
        ],
    ],
    widths: ["100%"],
};

function ShopGenerator() {
    const { currentUser, isLoading: authLoading } = useAuth(); // Get auth context
    const [allItems, setAllItems] = useState([]); // Master list of all possible items
    const [categoryData] = useState(() => extractUniqueCategories(itemData)); // Initialize category data
    const [savedShops, setSavedShops] = useState([]);
    const [showUnsavedDialogue, setShowUnsavedDialogue] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Inventory state
    const [inventory, setInventory] = useState([]);

    // Filter groups state management
    const {
        filters,
        setFilters,
        getFilterState,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections,
        getFilteredArray,
    } = useShopFilters();

    // Sorting state
    const { sortedItems, sortConfig, handleSort } = useSorting(inventory);

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
        handleResetChanges,
    } = useShopState(defaultShopData);

    // Snapshot and change tracking
    const { shopSnapshot, setShopSnapshot, getChangedFields, hasUnsavedChanges } = useShopSnapshot({
        shopState,
        filters,
        items: inventory,
    });

    // Shop operations
    const {
        handleLoadShops,
        handleLoadShopWithCheck,
        handleNewShop,
        handleCloneShop,
        handleSaveShop,
        handleDeleteShop,
    } = useShopOperations({
        currentUser,
        shopState,
        setShopState,
        filters,
        items: inventory,
        setItems: setInventory,
        setShopSnapshot,
        setSavedShops,
        setFilters,
        getFilteredArray,
        hasUnsavedChanges,
        setPendingAction,
        setShowUnsavedDialogue,
    });

    const handleUnsavedDialogueConfirm = () => {
        setShowUnsavedDialogue(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const handleUnsavedDialogueCancel = () => {
        setShowUnsavedDialogue(false);
        setPendingAction(null);
    };

    // Initial data loading
    useEffect(() => {
        try {
            // Format and process the imported data
            console.log("Loading items from itemData...");
            console.log("Raw itemData length:", itemData.length);

            const formattedData = itemData.map((item) => ({
                ...item,
                bulk: item.bulk?.trim() === "" ? "-" : item.bulk,
                level: item.level ? item.level : "0",
            }));

            console.log("Formatted data length:", formattedData.length);
            setAllItems(formattedData);
        } catch (error) {
            console.error("Error loading items:", error);
        }
    }, []);

    // Initialize shop - either from saved state or create new
    useEffect(() => {
        if (!authLoading && !shopState.id) {
            handleNewShop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading]);

    // Load shops when auth is ready and user is logged in
    useEffect(() => {
        if (!authLoading && currentUser) {
            handleLoadShops();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, currentUser]);

    // Shop generation
    const handleGenerateClick = () => {
        console.log("handleGenerateClick called");

        // Validate required data
        if (!allItems || allItems.length === 0) {
            console.error("No items loaded in allItems!");
            return;
        }

        console.log("Current state:", {
            currentGold: shopState.gold,
            lowestLevel: shopState.levelRange.min,
            highestLevel: shopState.levelRange.max,
            itemBias: shopState.itemBias,
            rarityDistribution: shopState.rarityDistribution,
            allItemsLength: allItems.length,
            filters: {
                categories: Array.from(filters.categories.entries()),
                subcategories: Array.from(filters.subcategories.entries()),
                traits: Array.from(filters.traits.entries()),
            },
        });

        const result = generateShopInventory({
            currentGold: shopState.gold,
            lowestLevel: shopState.levelRange.min,
            highestLevel: shopState.levelRange.max,
            itemBias: shopState.itemBias,
            rarityDistribution: shopState.rarityDistribution,
            includedCategories: getFilteredArray("categories", SELECTION_STATES.INCLUDE),
            excludedCategories: getFilteredArray("categories", SELECTION_STATES.EXCLUDE),
            includedSubcategories: getFilteredArray("subcategories", SELECTION_STATES.INCLUDE),
            excludedSubcategories: getFilteredArray("subcategories", SELECTION_STATES.EXCLUDE),
            includedTraits: getFilteredArray("traits", SELECTION_STATES.INCLUDE),
            excludedTraits: getFilteredArray("traits", SELECTION_STATES.EXCLUDE),
            allItems,
        });

        console.log("Generation result:", result);

        if (result && Array.isArray(result.items)) {
            setInventory(result.items);
            // Take a new snapshot with the current state
            const newSnapshot = takeShopSnapshot(shopState, filters, result.items);
            setShopSnapshot(newSnapshot);
            console.log("Inventory state updated with", result.items.length, "items");
        } else {
            console.error("Invalid result from generateShopInventory:", result);
        }
    };

    const handleAiAssistantChange = (newState) => {
        console.log("Ai Assistant state updated:", newState);
    };

    // Helper function to create a tab component
    const createTab = (type, key) => {
        switch (type) {
            case "Tab_Parameters":
                return (
                    <Tab_Parameters
                        key={key}
                        type={{ name: "Tab_Parameters" }}
                        currentGold={shopState.gold}
                        setCurrentGold={handleGoldChange}
                        lowestLevel={shopState.levelRange.min}
                        setLowestLevel={handleLowestLevelChange}
                        highestLevel={shopState.levelRange.max}
                        setHighestLevel={handleHighestLevelChange}
                        rarityDistribution={shopState.rarityDistribution}
                        setRarityDistribution={handleRarityDistributionChange}
                        itemBias={shopState.itemBias}
                        setItemBias={handleBiasChange}
                        categoryData={categoryData}
                        categoryStates={filters.categories}
                        subcategoryStates={filters.subcategories}
                        traitStates={filters.traits}
                        getFilterState={getFilterState}
                        toggleCategory={toggleCategory}
                        toggleSubcategory={toggleSubcategory}
                        toggleTrait={toggleTrait}
                        clearCategorySelections={clearCategorySelections}
                        clearSubcategorySelections={clearSubcategorySelections}
                        clearTraitSelections={clearTraitSelections}
                    />
                );
            case "Tab_InventoryTable":
                return (
                    <Tab_InventoryTable
                        key={key}
                        type={{ name: "Tab_InventoryTable" }}
                        items={sortedItems}
                        currentShopName={shopState.name}
                        handleGenerateClick={handleGenerateClick}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                );
            case "Tab_ChooseShop":
                return (
                    <Tab_ChooseShop
                        key={key}
                        type={{ name: "Tab_ChooseShop" }}
                        savedShops={savedShops}
                        onLoadShop={handleLoadShopWithCheck}
                        onNewShop={handleNewShop}
                        currentShopId={shopState.id}
                    />
                );
            case "Tab_ShopDetails":
                return (
                    <Tab_ShopDetails
                        key={key}
                        type={{ name: "Tab_ShopDetails" }}
                        currentShop={{
                            id: shopState.id,
                            name: shopState.name,
                            keeperName: shopState.keeperName,
                            type: shopState.type,
                            location: shopState.location,
                            description: shopState.description,
                            keeperDescription: shopState.keeperDescription,
                            dateCreated: shopState.dateCreated,
                            dateLastEdited: shopState.dateLastEdited,
                        }}
                        onShopDetailsChange={handleShopDetailsChange}
                        onSaveShop={handleSaveShop}
                        onCloneShop={handleCloneShop}
                        onDeleteShop={handleDeleteShop}
                        onResetChanges={() => handleResetChanges(shopSnapshot, setFilters, setInventory)}
                        savedShops={savedShops}
                        hasUnsavedChanges={hasUnsavedChanges}
                        changes={getChangedFields()}
                    />
                );
            case "Tab_AiAssistant":
                return (
                    <Tab_AiAssistant
                        key={key}
                        type={{ name: "Tab_AiAssistant" }}
                        currentShop={{
                            id: shopState.id,
                            name: shopState.name,
                            keeperName: shopState.keeperName,
                            type: shopState.type,
                            location: shopState.location,
                            description: shopState.description,
                            keeperDescription: shopState.keeperDescription,
                            dateCreated: shopState.dateCreated,
                            dateLastEdited: shopState.dateLastEdited,
                        }}
                        onAiAssistantChange={handleAiAssistantChange}
                    />
                );
            default:
                console.warn(`Unknown tab type: ${type}`);
                return null;
        }
    };

    // Load initial state from localStorage or use default
    const loadInitialState = () => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        let config = DEFAULT_TAB_STATE;

        // If we have a saved state, use saved configuration
        if (savedState) {
            try {
                config = JSON.parse(savedState);
            } catch (error) {
                console.error("Error loading saved tab state:", error);
            }
        }

        // Create tab components from configuration
        const groups = config.groups.map((group) => group.map((tab) => createTab(tab.type, tab.key)));

        return { groups, widths: config.widths };
    };

    const initialState = loadInitialState();

    // Tab management
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
    } = useTabManagement(initialState.groups, initialState.widths);

    // Save state whenever tab groups or widths change
    useEffect(() => {
        const saveState = () => {
            const groupsData = tabGroups.map((group) =>
                group.map((tab) => ({
                    type: tab.type.name,
                    key: tab.key,
                }))
            );

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    groups: groupsData,
                    widths: flexBasis,
                })
            );
        };

        saveState();
    }, [tabGroups, flexBasis]);

    return (
        <div className={`shop-generator ${isResizing ? "resizing" : ""}`}>
            {authLoading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {showUnsavedDialogue && (
                        <UnsavedChangesDialogue
                            onConfirm={handleUnsavedDialogueConfirm}
                            onCancel={handleUnsavedDialogueCancel}
                            changes={getChangedFields()}
                            currentShopName={shopState.name}
                        />
                    )}
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
                                            categoryStates: filters.categories,
                                            subcategoryStates: filters.subcategories,
                                            traitStates: filters.traits,
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
                                        });
                                    case "Tab_ShopDetails":
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
                                            onShopDetailsChange: handleShopDetailsChange,
                                            onSaveShop: handleSaveShop,
                                            onCloneShop: handleCloneShop,
                                            onDeleteShop: handleDeleteShop,
                                            onResetChanges: () => handleResetChanges(shopSnapshot, setFilters, setInventory),
                                            savedShops,
                                            hasUnsavedChanges,
                                            changes: getChangedFields(),
                                        });
                                    case "Tab_ChooseShop":
                                        return React.cloneElement(tab, {
                                            savedShops,
                                            onLoadShop: handleLoadShopWithCheck,
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
                </>
            )}
        </div>
    );
}

export default ShopGenerator;
