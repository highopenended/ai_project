// import React, { useState } from 'react';

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
import shopData from "./utils/shopData";
import { useShopGenerator } from "../../../context/ShopGeneratorContext";
import { SELECTION_STATES } from "../../../context/shopGeneratorConstants";
import { generateShopInventory } from "./utils/generateShopInventory";
import { saveOrUpdateShopData, loadShopData } from "./utils/firebaseShopUtils";

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

function ShopGenerator() {
    // Get auth context
    const { currentUser, isLoading: authLoading } = useAuth();

    // Core state management
    const [items, setItems] = useState([]); // Current shop inventory
    const [allItems, setAllItems] = useState([]); // Master list of all possible items
    const [currentGold, setCurrentGold] = useState(1000);
    const [lowestLevel, setLowestLevel] = useState(0);
    const [highestLevel, setHighestLevel] = useState(10);
    const [sortConfig, setSortConfig] = useState([]);
    const [itemBias, setItemBias] = useState({ x: 0.5, y: 0.5 }); // Default to center
    const [rarityDistribution, setRarityDistribution] = useState({
        Common: 95.0,
        Uncommon: 4.5,
        Rare: 0.49,
        Unique: 0.01,
    });

    // Shop state management
    // currentShop contains all metadata and parameters for the current shop
    // savedShops maintains the list of all shops for the current user
    const [currentShop, setCurrentShop] = useState(shopData);
    const [savedShops, setSavedShops] = useState([]);

    // Get filter states from context
    const { categoryStates, subcategoryStates, traitStates, setCategoryStates, setSubcategoryStates, setTraitStates } =
        useShopGenerator();

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

    // Load shops when auth is ready and user is logged in
    useEffect(() => {
        if (!authLoading && currentUser) {
            loadShops();
        }
    }, [authLoading, currentUser]);

    // Function to get filtered arrays from Maps
    const getFilteredArray = (stateMap, includeState, defaultMap = new Map()) => {
        if (!stateMap) stateMap = defaultMap;
        return Array.from(stateMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    };

    // Shop generation
    const handleGenerateClick = () => {
        console.log("handleGenerateClick called");

        // Validate required data
        if (!allItems || allItems.length === 0) {
            console.error("No items loaded in allItems!");
            return;
        }

        if (!categoryStates || !subcategoryStates || !traitStates) {
            console.error("Filter states not initialized!", {
                categoryStates: !!categoryStates,
                subcategoryStates: !!subcategoryStates,
                traitStates: !!traitStates,
            });
            return;
        }

        console.log("Current state:", {
            currentGold,
            lowestLevel,
            highestLevel,
            itemBias,
            rarityDistribution,
            allItemsLength: allItems.length,
        });

        // Convert Maps to arrays of included/excluded items
        const includedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);

        const excludedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);

        const includedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);

        const excludedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);

        const includedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);

        const excludedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);

        console.log("Filter states:", {
            categoryStates: Array.from(categoryStates.entries()),
            subcategoryStates: Array.from(subcategoryStates.entries()),
            traitStates: Array.from(traitStates.entries()),
        });

        console.log("Processed filters:", {
            includedCategories,
            excludedCategories,
            includedSubcategories,
            excludedSubcategories,
            includedTraits,
            excludedTraits,
        });

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
            allItems,
        });

        console.log("Generation result:", result);

        if (result && Array.isArray(result.items)) {
            setItems(result.items);
            console.log("Items state updated with", result.items.length, "items");
        } else {
            console.error("Invalid result from generateShopInventory:", result);
        }
    };

/**
     * Handles saving the current shop state to Firebase
     * This is the single point of persistence for shop data
     * Called by the RightSidebar's SaveShopButton
     */
const handleSaveShop = async () => {
    if (!currentUser) {
        alert("Please log in to save shops");
        return;
    }

    try {
        const userId = currentUser.uid;
        // Construct a complete snapshot of current shop state
        const shopDataWithId = {
            ...currentShop,
            shortData: {
                shopName: currentShop.shortData.shopName || "",
                shopKeeperName: currentShop.shortData.shopKeeperName || "",
                type: currentShop.shortData.type || "",
                location: currentShop.shortData.location || "",
                description: currentShop.shortData.description || "",
            },
            longData: {
                shopDetails: currentShop.longData.shopDetails || "",
                shopKeeperDetails: currentShop.longData.shopKeeperDetails || "",
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
                    excluded: getFilteredArray(categoryStates, SELECTION_STATES.EXCLUDE),
                },
                subcategories: {
                    included: getFilteredArray(subcategoryStates, SELECTION_STATES.INCLUDE),
                    excluded: getFilteredArray(subcategoryStates, SELECTION_STATES.EXCLUDE),
                },
                traits: {
                    included: getFilteredArray(traitStates, SELECTION_STATES.INCLUDE),
                    excluded: getFilteredArray(traitStates, SELECTION_STATES.EXCLUDE),
                },
                currentStock: items,
            },
            dateLastEdited: new Date(),
            dateCreated: currentShop.dateCreated || new Date(),
        };

        const shopId = await saveOrUpdateShopData(userId, shopDataWithId);

        // Update the current shop with the new ID
        setCurrentShop((prevDetails) => ({
            ...prevDetails,
            id: shopId,
        }));

        console.log("Shop saved with ID:", shopId);
        alert("Shop saved successfully!");
    } catch (error) {
        console.error("Error saving shop:", error);
        alert("Error saving shop. Please try again.");
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
            console.error("Error loading shops:", error);
        }
    };

    /**
     * Handles loading a specific shop's data
     * This is the central point for restoring all shop state
     * Called when a user selects a shop from the saved shops list
     */
    const handleLoadShop = (shop) => {
        console.log("Loading shop:", shop);
        // Convert Firebase Timestamps to JavaScript Dates
        const processedShop = {
            ...shop,
            dateCreated: shop.dateCreated?.toDate?.() || shop.dateCreated || new Date(),
            dateLastEdited: shop.dateLastEdited?.toDate?.() || shop.dateLastEdited || new Date()
        };
        
        // Update all state variables from the loaded shop
        setCurrentShop(processedShop);
        setCurrentGold(shop.parameters.goldAmount || 0);
        setLowestLevel(shop.parameters.levelLow || 0);
        setHighestLevel(shop.parameters.levelHigh || 10);
        setItemBias(shop.parameters.shopBias || { x: 0.5, y: 0.5 });
        setRarityDistribution(
            shop.parameters.rarityDistribution || {
                Common: 95.0,
                Uncommon: 4.5,
                Rare: 0.49,
                Unique: 0.01,
            }
        );
        setItems(shop.parameters.currentStock || []);

        // Restore filter states from saved data
        const categoryMap = new Map();
        shop.parameters.categories?.included?.forEach((category) =>
            categoryMap.set(category, SELECTION_STATES.INCLUDE)
        );
        shop.parameters.categories?.excluded?.forEach((category) =>
            categoryMap.set(category, SELECTION_STATES.EXCLUDE)
        );
        setCategoryStates(categoryMap);

        const subcategoryMap = new Map();
        shop.parameters.subcategories?.included?.forEach((subcategory) =>
            subcategoryMap.set(subcategory, SELECTION_STATES.INCLUDE)
        );
        shop.parameters.subcategories?.excluded?.forEach((subcategory) =>
            subcategoryMap.set(subcategory, SELECTION_STATES.EXCLUDE)
        );
        setSubcategoryStates(subcategoryMap);

        const traitMap = new Map();
        shop.parameters.traits?.included?.forEach((trait) => traitMap.set(trait, SELECTION_STATES.INCLUDE));
        shop.parameters.traits?.excluded?.forEach((trait) => traitMap.set(trait, SELECTION_STATES.EXCLUDE));
        setTraitStates(traitMap);
    };

    const handleSort = (columnName) => {
        setSortConfig((prevConfig) => {
            // Remove the column if it exists in the current config
            const newConfig = prevConfig.filter((sort) => sort.column !== columnName);

            // Get the current direction for this column
            const currentDirection = prevConfig.find((sort) => sort.column === columnName)?.direction;

            // Get the next direction in the cycle
            const nextDirection = getNextSortDirection(currentDirection, columnName);

            // If there's a next direction, add it to the end of the queue
            if (nextDirection) {
                newConfig.push({ column: columnName, direction: nextDirection });
            }

            return newConfig;
        });
    };

    // Shop management functions
    const handleNewShop = () => {
        // Reset all state to initial values
        setCurrentShop(shopData);
        setCurrentGold(1000);
        setLowestLevel(0);
        setHighestLevel(10);
        setItemBias({ x: 0.5, y: 0.5 });
        setRarityDistribution({
            Common: 95.0,
            Uncommon: 4.5,
            Rare: 0.49,
            Unique: 0.01,
        });
        setItems([]);

        // Clear all filters
        setCategoryStates(new Map());
        setSubcategoryStates(new Map());
        setTraitStates(new Map());
    };

    const handleCloneShop = () => {
        const { id, ...shopWithoutId } = currentShop;
        const clonedShop = {
            ...shopWithoutId,
            shortData: {
                ...currentShop.shortData,
                shopName: `${currentShop.shortData.shopName} (Clone)`
            },
            dateCreated: new Date(),
            dateLastEdited: new Date()
        };
        setCurrentShop(clonedShop);
    };

    const handleShopDetailsChange = (e) => {
        const { name, value } = e.target;
        console.log("Handling shop details change:", { name, value }); // Debug log
        setCurrentShop((prevShop) => {
            // Create a copy of the previous shop
            const newShop = { ...prevShop };

            // Check if this is a shortData field
            if (Object.keys(prevShop.shortData).includes(name)) {
                newShop.shortData = {
                    ...prevShop.shortData,
                    [name]: value,
                };
            }
            // Check if this is a longData field
            else if (Object.keys(prevShop.longData).includes(name)) {
                newShop.longData = {
                    ...prevShop.longData,
                    [name]: value,
                };
            }

            console.log("Updated shop:", newShop); // Debug log
            return newShop;
        });
    };

    // Load initial state from localStorage or use default
    const loadInitialState = () => {
        // localStorage.clear(STORAGE_KEY);

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const { groups, widths } = JSON.parse(savedState);
            // Recreate tab components from saved data
            const recreatedGroups = groups.map(
                (group) =>
                    group
                        .map((tab) => {
                            // Create component with appropriate props based on type
                            switch (tab.type) {
                                case "Tab_Parameters":
                                    return (
                                        <Tab_Parameters
                                            key={tab.key}
                                            type={{ name: "Tab_Parameters" }}
                                            currentGold={currentGold}
                                            setCurrentGold={setCurrentGold}
                                            lowestLevel={lowestLevel}
                                            setLowestLevel={setLowestLevel}
                                            highestLevel={highestLevel}
                                            setHighestLevel={setHighestLevel}
                                            rarityDistribution={rarityDistribution}
                                            setRarityDistribution={setRarityDistribution}
                                            itemBias={itemBias}
                                            setItemBias={setItemBias}
                                        />
                                    );
                                case "Tab_InventoryTable":
                                    return (
                                        <Tab_InventoryTable
                                            key={tab.key}
                                            type={{ name: "Tab_InventoryTable" }}
                                            items={items}
                                            currentShopName={currentShop.shortData.shopName || "Unnamed Shop"}
                                            handleGenerateClick={handleGenerateClick}
                                            sortConfig={sortConfig}
                                            onSort={handleSort}
                                        />
                                    );
                                case "Tab_ChooseShop":
                                    return (
                                        <Tab_ChooseShop
                                            key={tab.key}
                                            type={{ name: "Tab_ChooseShop" }}
                                            savedShops={savedShops}
                                            onLoadShop={handleLoadShop}
                                            onNewShop={handleNewShop}
                                        />
                                    );
                                case "Tab_ShopDetails":
                                    return (
                                        <Tab_ShopDetails 
                                            key={tab.key} 
                                            type={{ name: "Tab_ShopDetails" }}
                                            currentShop={currentShop}
                                            onShopDetailsChange={handleShopDetailsChange}
                                            onSaveShop={handleSaveShop}
                                            onCloneShop={handleCloneShop}
                                        />
                                    );
                                case "Tab_AiAssistant":
                                    return <Tab_AiAssistant key={tab.key} type={{ name: "Tab_AiAssistant" }} />;
                                default:
                                    console.warn(`Unknown tab type: ${tab.type}`);
                                    return null;
                            }
                        })
                        .filter(Boolean) // Remove any null components
            );
            return { groups: recreatedGroups, widths };
        }

        // Default state if nothing is saved
        return {
            groups: [
                [
                    <Tab_Parameters
                        key="Tab_Parameters-0"
                        type={{ name: "Tab_Parameters" }}
                        handleGenerateClick={handleGenerateClick}
                        currentGold={currentGold}
                        setCurrentGold={setCurrentGold}
                        lowestLevel={lowestLevel}
                        setLowestLevel={setLowestLevel}
                        highestLevel={highestLevel}
                        setHighestLevel={setHighestLevel}
                        rarityDistribution={rarityDistribution}
                        setRarityDistribution={setRarityDistribution}
                        itemBias={itemBias}
                        setItemBias={setItemBias}
                    />,
                    <Tab_InventoryTable
                        key="Tab_InventoryTable-0"
                        type={{ name: "Tab_InventoryTable" }}
                        items={items}
                        currentShopName={currentShop.shortData.shopName || "Unnamed Shop"}
                        handleGenerateClick={handleGenerateClick}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />,
                    <Tab_ChooseShop
                        key="Tab_ChooseShop-0"
                        type={{ name: "Tab_ChooseShop" }}
                        savedShops={savedShops}
                        onLoadShop={handleLoadShop}
                        onNewShop={handleNewShop}
                    />,
                    <Tab_ShopDetails 
                        key="Tab_ShopDetails-0" 
                        type={{ name: "Tab_ShopDetails" }}
                        currentShop={currentShop}
                        onShopDetailsChange={handleShopDetailsChange}
                        onSaveShop={handleSaveShop}
                        onCloneShop={handleCloneShop}
                    />,
                    <Tab_AiAssistant key="Tab_AiAssistant-0" type={{ name: "Tab_AiAssistant" }} />,
                ],
            ],
            widths: ["100%"],
        };
    };

    const initialState = loadInitialState();
    const [tabGroups, setTabGroups] = useState(initialState.groups);
    const [flexBasis, setFlexBasis] = useState(initialState.widths);

    // State for drag and drop operations
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [sourceGroupIndex, setSourceGroupIndex] = useState(null);
    const [dropIndicators, setDropIndicators] = useState({
        leftGroup: null,
        rightGroup: null,
        betweenGroups: null,
        betweenGroupsRight: null,
    });
    const [isResizing, setIsResizing] = useState(false);

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

    // Remove the automatic flex basis initialization since we're loading from storage
    useEffect(() => {
        if (tabGroups.length !== flexBasis.length) {
            const defaultWidths = tabGroups.map(() => `${100 / tabGroups.length}%`);
            setFlexBasis(defaultWidths);

            // Save the new widths
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    groups: tabGroups.map((group) =>
                        group.map((tab) => ({
                            type: tab.type.name,
                            key: tab.key,
                        }))
                    ),
                    widths: defaultWidths,
                })
            );
        }
    }, [tabGroups.length]);

    // Add window-level mouse up handler
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
            }
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);

        // Cleanup
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [isResizing]);

    /**
     * Handles moving tabs within and between groups
     * @param {Array|Array[]} newTabs - Either the reordered tabs or [sourceTab, dropIndex]
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {number} [targetGroupIndex] - Index of the target group (if moving between groups)
     */
    const handleTabMove = (newTabs, sourceGroupIndex, targetGroupIndex) => {
        // First reset all drag states to ensure clean state for next operation
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setSourceGroupIndex(null);
        setDropIndicators({
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null,
            betweenGroupsRight: null,
        });

        // Then update the groups after a short delay to ensure state is clean
        setTimeout(() => {
            setTabGroups((prevGroups) => {
                const newGroups = [...prevGroups];

                if (targetGroupIndex !== undefined) {
                    const [sourceTab, dropIndex] = newTabs;
                    const sourceGroup = [...prevGroups[sourceGroupIndex]];

                    // Find and remove the source tab
                    const sourceTabIndex = sourceGroup.findIndex(
                        (tab) => tab.type.name === sourceTab.type.name && (!tab.key || tab.key === sourceTab.key)
                    );
                    if (sourceTabIndex !== -1) {
                        sourceGroup.splice(sourceTabIndex, 1);
                    }

                    if (sourceGroup.length === 0) {
                        newGroups.splice(sourceGroupIndex, 1);
                        if (targetGroupIndex > sourceGroupIndex) {
                            targetGroupIndex--;
                        }
                    } else {
                        newGroups[sourceGroupIndex] = sourceGroup;
                    }

                    // When moving back to original group, don't create a new tab
                    const targetGroup = [...(newGroups[targetGroupIndex] || [])];
                    const isMovingBackToOriginal = sourceGroupIndex === targetGroupIndex;

                    if (isMovingBackToOriginal) {
                        targetGroup.splice(dropIndex, 0, sourceTab);
                    } else {
                        const newTab = React.cloneElement(sourceTab, {
                            key: `${sourceTab.type.name}-${Date.now()}`,
                        });
                        targetGroup.splice(dropIndex, 0, newTab);
                    }

                    newGroups[targetGroupIndex] = targetGroup;
                } else {
                    newGroups[sourceGroupIndex] = newTabs;
                }

                return newGroups;
            });
        }, 0);
    };

    /**
     * Handles creating new groups by splitting existing ones
     * @param {Object} tabInfo - Information about the tab being split
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {boolean|number} targetPosition - Where to create the new group
     */
    const handleTabSplit = (tabInfo, sourceGroupIndex, targetPosition) => {
        setTabGroups((prevGroups) => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];

            const sourceTab = sourceGroup.find((tab) => tab.type.name === tabInfo.type);

            if (!sourceTab) {
                return prevGroups;
            }

            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);

            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`,
            });

            const newGroup = [newTab];

            if (sourceGroup.length === 0) {
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === "number" && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            // Handle numeric target position (between groups)
            if (typeof targetPosition === "number") {
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                newGroups.push(newGroup);
            } else {
                newGroups.unshift(newGroup);
            }

            return newGroups;
        });
    };

    const handleResize = (newWidth, groupIndex) => {
        if (groupIndex >= tabGroups.length - 1) return;

        setIsResizing(true);
        const container = document.querySelector(".shop-generator");
        if (!container) return;

        const totalWidth = container.clientWidth;
        const minWidth = 200; // This is the minimum width of the parameters tab in pixels

        setFlexBasis((prev) => {
            const newBasis = [...prev];

            // Calculate the new width percentage
            let currentPercent = (newWidth / totalWidth) * 100;

            // Ensure minimum width
            if (currentPercent < (minWidth / totalWidth) * 100) {
                currentPercent = (minWidth / totalWidth) * 100;
            }

            // Calculate remaining width for next group
            const remainingPercent = parseFloat(newBasis[groupIndex]) + parseFloat(newBasis[groupIndex + 1]);
            const nextGroupPercent = remainingPercent - currentPercent;

            // Ensure next group also maintains minimum width
            if (nextGroupPercent < (minWidth / totalWidth) * 100) {
                return prev;
            }

            newBasis[groupIndex] = `${currentPercent}%`;
            newBasis[groupIndex + 1] = `${nextGroupPercent}%`;

            return newBasis;
        });
    };

    // Rarity order map for sorting (from least rare to most rare)
    const RARITY_ORDER = {
        Common: 1,
        Uncommon: 2,
        Rare: 3,
        Unique: 4,
    };

    // Price conversion helper
    const convertPriceToGold = (priceString) => {
        if (!priceString) return 0;

        // Remove commas from the price string before parsing
        const cleanPriceString = priceString.replace(/,/g, "");
        const match = cleanPriceString.match(/(\d+(?:\.\d+)?)\s*(gp|sp|cp)/);
        if (!match) return 0;

        const [, value, unit] = match;
        const numValue = parseFloat(value);

        switch (unit) {
            case "gp":
                return numValue;
            case "sp":
                return numValue / 10;
            case "cp":
                return numValue / 100;
            default:
                return 0;
        }
    };

    // Sorting functionality
    const getNextSortDirection = (currentDirection, columnName) => {
        // Special handling for text-based columns
        if (columnName === "name" || columnName === "item_category" || columnName === "item_subcategory") {
            switch (currentDirection) {
                case undefined:
                    return "asc"; // First click: alphabetical
                case "asc":
                    return "desc"; // Second click: reverse alphabetical
                case "desc":
                    return undefined; // Third click: back to default
                default:
                    return undefined;
            }
        }

        // Default behavior for price and total
        switch (currentDirection) {
            case undefined:
                return "desc";
            case "desc":
                return "asc";
            case "asc":
                return undefined;
            default:
                return undefined;
        }
    };

    const sortItems = (itemsToSort) => {
        if (!sortConfig.length) return itemsToSort;

        return [...itemsToSort].sort((a, b) => {
            for (const { column, direction } of sortConfig) {
                let comparison = 0;

                switch (column) {
                    case "count":
                        comparison = a.count - b.count;
                        break;
                    case "name":
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case "level":
                        comparison = parseInt(a.level) - parseInt(b.level);
                        break;
                    case "price":
                        comparison = convertPriceToGold(a.price) - convertPriceToGold(b.price);
                        break;
                    case "total":
                        comparison = a.total - b.total;
                        break;
                    case "rarity":
                        comparison = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
                        break;
                    case "item_category":
                        comparison = (a.item_category || "").localeCompare(b.item_category || "");
                        break;
                    case "item_subcategory":
                        comparison = (a.item_subcategory || "").localeCompare(b.item_subcategory || "");
                        break;
                    default:
                        comparison = 0;
                }

                if (comparison !== 0) {
                    // For text-based columns, flip the comparison direction to match natural alphabetical order
                    if (column === "name" || column === "item_category" || column === "item_subcategory") {
                        return direction === "asc" ? comparison : -comparison;
                    }
                    // For all other columns, maintain the existing direction logic
                    return direction === "asc" ? comparison : -comparison;
                }
            }
            return 0;
        });
    };

    // Handle sorting when sortConfig changes
    useEffect(() => {
        setItems(sortItems(items));
    }, [sortConfig]);

    // State handlers
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

    // Shop state synchronization
    useEffect(() => {
        const updateTimeout = setTimeout(() => {
            setCurrentShop((prevShop) => {
                const newParameters = {
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
                            .map(([category]) => category),
                    },
                    subcategories: {
                        included: Array.from((subcategoryStates || new Map()).entries())
                            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                            .map(([subcategory]) => subcategory),
                        excluded: Array.from((subcategoryStates || new Map()).entries())
                            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                            .map(([subcategory]) => subcategory),
                    },
                    traits: {
                        included: Array.from((traitStates || new Map()).entries())
                            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
                            .map(([trait]) => trait),
                        excluded: Array.from((traitStates || new Map()).entries())
                            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
                            .map(([trait]) => trait),
                    },
                    currentStock: items,
                };

                // Only update if there are actual changes
                if (JSON.stringify(prevShop.parameters) === JSON.stringify(newParameters)) {
                    return prevShop;
                }

                return {
                    ...prevShop,
                    parameters: newParameters,
                };
            });
        }, 100); // Debounce updates

        return () => clearTimeout(updateTimeout);
    }, [
        currentGold,
        lowestLevel,
        highestLevel,
        itemBias,
        rarityDistribution,
        categoryStates,
        subcategoryStates,
        traitStates,
        items,
    ]);

    

    const handleAiAssistantChange = (newState) => {
        console.log("Ai Assistant state updated:", newState);
    };

    return (
        <div className={`shop-generator ${isResizing ? "resizing" : ""}`}>
            {authLoading ? (
                <div>Loading...</div>
            ) : (
                tabGroups.map((tabs, index) => (
                    <TabContainer
                        key={index}
                        groupIndex={index}
                        tabs={tabs.map((tab) => {
                            // Add props based on tab type
                            switch (tab.type.name) {
                                case "Tab_Parameters":
                                    return React.cloneElement(tab, {
                                        currentGold,
                                        setCurrentGold: handleGoldChange,
                                        lowestLevel,
                                        setLowestLevel: handleLowestLevelChange,
                                        highestLevel,
                                        setHighestLevel: handleHighestLevelChange,
                                        rarityDistribution,
                                        setRarityDistribution: handleRarityDistributionChange,
                                        itemBias,
                                        setItemBias: handleBiasChange,
                                    });
                                case "Tab_InventoryTable":
                                    return React.cloneElement(tab, {
                                        items,
                                        sortConfig,
                                        onSort: handleSort,
                                        currentShop: currentShop?.shortData?.shopName || "Unnamed Shop",
                                        handleGenerateClick,
                                    });
                                case "Tab_ShopDetails":
                                    return React.cloneElement(tab, {
                                        currentShop,
                                        onShopDetailsChange: handleShopDetailsChange,
                                        onSave: handleSaveShop,
                                    });
                                case "Tab_ChooseShop":
                                    return React.cloneElement(tab, {
                                        savedShops,
                                        onLoadShop: handleLoadShop,
                                        onNewShop: handleNewShop,
                                    });
                                case "Tab_AiAssistant":
                                    return React.cloneElement(tab, {
                                        currentShop,
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
                        onDragStart={(tab, tabIndex) => {
                            setDraggedTab(tab);
                            setDraggedTabIndex(tabIndex);
                            setSourceGroupIndex(index);
                        }}
                        onDragEnd={() => {
                            setDraggedTab(null);
                            setDraggedTabIndex(null);
                            setSourceGroupIndex(null);
                            setIsResizing(false);
                            setDropIndicators({
                                leftGroup: null,
                                rightGroup: null,
                                betweenGroups: null,
                                betweenGroupsRight: null,
                            });
                        }}
                        onDropIndicatorChange={(indicators) => {
                            setDropIndicators((prev) => ({ ...prev, ...indicators }));
                        }}
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
                ))
            )}
        </div>
    );
}

export default ShopGenerator;
