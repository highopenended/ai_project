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
import { useSorting } from "./utils/sortingUtils";
import { extractUniqueCategories } from "./utils/categoryUtils";
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
    const [savedShops, setSavedShops] = useState([]); // Saved shops state
    const [inventory, setInventory] = useState([]); // Inventory state

    // Filter groups state management
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
        handleRevertChanges,
    } = useShopState(defaultShopData);

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
        if (!authLoading && !shopState.id) handleNewShop();
        if (!authLoading && currentUser) handleLoadShopList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, currentUser]);

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
                        categoryStates={filterMaps.categories}
                        subcategoryStates={filterMaps.subcategories}
                        traitStates={filterMaps.traits}
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
                        isGenerating={isGenerating}
                    />
                );
            case "Tab_ChooseShop":
                return (
                    <Tab_ChooseShop
                        key={key}
                        type={{ name: "Tab_ChooseShop" }}
                        savedShops={savedShops}
                        onLoadShop={handleLoadShop}
                        onNewShop={handleNewShop}
                        currentShopId={shopState.id}
                    />
                );
            case "Tab_ShopDetails":
                return (
                    <Tab_ShopDetails
                        key={key}
                        type={{ name: "Tab_ShopDetails" }}
                        shopState={shopState}
                        onShopDetailsChange={handleShopDetailsChange}
                        onSaveShop={handleSaveShop}
                        onCloneShop={handleCloneShop}
                        onDeleteShop={handleDeleteShop}
                        onRevertChanges={() => handleRevertChanges(shopSnapshot, setFilterMaps, setInventory)}
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
                        shopState={shopState}
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
                </>
            )}
        </div>
    );
}

export default ShopGenerator;
