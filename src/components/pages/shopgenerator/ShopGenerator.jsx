import React, { useMemo } from "react";
import { useState, useEffect, useCallback } from "react";
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
import { saveOrUpdateShopData, loadShopData, deleteShopData } from "./utils/firebaseShopUtils";
import UnsavedChangesDialogue from "./shared/UnsavedChangesDialogue";
import { useSorting } from "./utils/sortingUtils";
import { extractUniqueCategories } from "./utils/categoryUtils";
import defaultShopData from "./utils/shopData";
import { compareShopStates, hasChanges, takeShopSnapshot } from "./utils/shopStateUtils";

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

    // Initialize category data (Categories with subcategories and their count)
    const [categoryData] = useState(() => {
        const saved = localStorage.getItem("shop-categories");
        if (saved) return JSON.parse(saved);

        const extracted = extractUniqueCategories(itemData);
        localStorage.setItem("shop-categories", JSON.stringify(extracted));
        return extracted;
    });

    // Master list of all possible items
    const [allItems, setAllItems] = useState([]);

    // Combined shop state using the template
    const [shopState, setShopState] = useState(() => ({
        gold: defaultShopData.gold,
        levelRange: defaultShopData.levelRange,
        itemBias: defaultShopData.itemBias,
        rarityDistribution: defaultShopData.rarityDistribution,
        filters: {
            categories: new Map(),
            subcategories: new Map(),
            traits: new Map(),
        }
    }));

    // Inventory state (kept separate for performance)
    const [items, setItems] = useState([]);
    const { sortedItems, sortConfig, handleSort } = useSorting(items);

    // Filter state management functions
    const getFilterState = (filterType, key) => {
        return shopState.filters[filterType].get(key) || SELECTION_STATES.IGNORE;
    };

    const updateFilter = (filterType, key) => {
        const currentState = getFilterState(filterType, key);
        const nextState = toggleState(currentState);

        // Toggle state helper function
        function toggleState(currentState) {
            if (currentState === SELECTION_STATES.IGNORE) return SELECTION_STATES.INCLUDE;
            if (currentState === SELECTION_STATES.INCLUDE) return SELECTION_STATES.EXCLUDE;
            return SELECTION_STATES.IGNORE;
        }

        setShopState((prev) => {
            const newFilters = { ...prev.filters };
            const newMap = new Map(newFilters[filterType]);

            if (nextState === SELECTION_STATES.IGNORE) {
                newMap.delete(key);
            } else {
                newMap.set(key, nextState);
            }

            newFilters[filterType] = newMap;
            return {
                ...prev,
                filters: newFilters,
            };
        });
    };

    const clearFilter = (filterType) => {
        setShopState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filterType]: new Map(),
            },
        }));
    };

    // Specific filter handlers
    const toggleCategory = (category) => updateFilter("categories", category);
    const toggleSubcategory = (subcategory) => updateFilter("subcategories", subcategory);
    const toggleTrait = (trait) => updateFilter("traits", trait);

    const clearCategorySelections = () => clearFilter("categories");
    const clearSubcategorySelections = () => clearFilter("subcategories");
    const clearTraitSelections = () => clearFilter("traits");

    // Shop details state
    const [shopDetails, setShopDetails] = useState({
        id: "",
        name: "Unnamed Shop",
        keeperName: "Unknown",
        type: "General Store",
        location: "Unknown Location",
        description: "No details available",
        keeperDescription: "No details available",
        dateCreated: new Date(),
        dateLastEdited: new Date(),
    });

    // Function to get filtered arrays from Maps
    const getFilteredArray = useCallback((filterType, includeState) => {
        const filterMap = shopState.filters[filterType];
        return Array.from(filterMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    }, [shopState.filters]);

    const [savedShops, setSavedShops] = useState([]);
    const [showUnsavedDialogue, setShowUnsavedDialogue] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [shopSnapshot, setShopSnapshot] = useState(null);

    // Function to get changed fields by comparing current state with snapshot
    const getChangedFields = () => {
        if (!shopSnapshot) return { basic: {}, parameters: {}, hasInventoryChanged: false };
        
        return compareShopStates(
            {
                // Current state
                ...shopDetails,
                gold: shopState.gold,
                levelRange: shopState.levelRange,
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                filters: shopState.filters,
                currentStock: items
            },
            shopSnapshot
        );
    };

    // Add computed hasUnsavedChanges
    const hasUnsavedChanges = useMemo(() => {
        const changes = getChangedFields();
        return hasChanges(changes);
    }, [shopDetails, shopState, items, shopSnapshot]);

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
        if (!authLoading) {
            const savedShop = localStorage.getItem("currentShop");
            if (savedShop) {
                const parsedShop = JSON.parse(savedShop);
                handleLoadShop(parsedShop);
            } else if (!shopDetails.id) {
                handleNewShop();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading]);

    // Load shops when auth is ready and user is logged in
    useEffect(() => {
        if (!authLoading && currentUser) {
            loadShops();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, currentUser]);

    // Save shop state when it changes
    useEffect(() => {
        if (shopDetails.id) {
            const savedShopData = {
                id: shopDetails.id,
                name: shopDetails.name,
                keeperName: shopDetails.keeperName,
                type: shopDetails.type,
                location: shopDetails.location,
                description: shopDetails.description,
                keeperDescription: shopDetails.keeperDescription,
                parameters: {
                    goldAmount: shopState.gold,
                    levelLow: shopState.levelRange.min,
                    levelHigh: shopState.levelRange.max,
                    shopBias: shopState.itemBias,
                    rarityDistribution: shopState.rarityDistribution,
                    categories: {
                        included: getFilteredArray("categories", SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray("categories", SELECTION_STATES.EXCLUDE),
                    },
                    subcategories: {
                        included: getFilteredArray("subcategories", SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray("subcategories", SELECTION_STATES.EXCLUDE),
                    },
                    traits: {
                        included: getFilteredArray("traits", SELECTION_STATES.INCLUDE),
                        excluded: getFilteredArray("traits", SELECTION_STATES.EXCLUDE),
                    },
                },
                currentStock: items,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,
                filterStates: {
                    categories: Array.from(shopState.filters.categories.entries()),
                    subcategories: Array.from(shopState.filters.subcategories.entries()),
                    traits: Array.from(shopState.filters.traits.entries()),
                },
            };
            localStorage.setItem("currentShop", JSON.stringify(savedShopData));
        }
    }, [
        shopDetails.id,
        shopDetails.name,
        shopDetails.keeperName,
        shopDetails.type,
        shopDetails.location,
        shopDetails.description,
        shopDetails.keeperDescription,
        shopState.gold,
        shopState.levelRange.min,
        shopState.levelRange.max,
        shopState.itemBias,
        shopState.rarityDistribution,
        items,
        shopDetails.dateCreated,
        shopDetails.dateLastEdited,
        shopState.filters.categories,
        shopState.filters.subcategories,
        shopState.filters.traits,
        getFilteredArray,
    ]);

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
                categories: Array.from(shopState.filters.categories.entries()),
                subcategories: Array.from(shopState.filters.subcategories.entries()),
                traits: Array.from(shopState.filters.traits.entries()),
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
            setItems(result.items);
            setShopSnapshot(result.items);
            console.log("Items state updated with", result.items.length, "items");
        } else {
            console.error("Invalid result from generateShopInventory:", result);
        }
    };

    const handleShopDetailsChange = (e) => {
        const { name, value } = e.target;

        // Update the appropriate state based on the field name
        switch (name) {
            case "shopName":
                setShopDetails((prev) => ({ ...prev, name: value }));
                break;
            case "shopKeeperName":
                setShopDetails((prev) => ({ ...prev, keeperName: value }));
                break;
            case "type":
                setShopDetails((prev) => ({ ...prev, type: value }));
                break;
            case "location":
                setShopDetails((prev) => ({ ...prev, location: value }));
                break;
            case "shopDetails":
                setShopDetails((prev) => ({ ...prev, description: value }));
                break;
            case "shopKeeperDetails":
                setShopDetails((prev) => ({ ...prev, keeperDescription: value }));
                break;
            default:
                console.warn("Unknown field name:", name);
        }
        setShopDetails((prev) => ({ ...prev, dateLastEdited: new Date() }));
    };

    const handleLoadShop = (shop) => {
        if (hasUnsavedChanges) {
            setPendingAction(() => () => {
                loadShopInternal(shop);
            });
            setShowUnsavedDialogue(true);
            return;
        }
        loadShopInternal(shop);
    };

    const loadShopInternal = async (shop) => {
        try {
            // Convert date strings or Firebase Timestamps to JavaScript Dates
            const loadedDateCreated =
                shop.dateCreated?.toDate?.() ||
                (typeof shop.dateCreated === "string" ? new Date(shop.dateCreated) : new Date());
            const loadedDateLastEdited =
                shop.dateLastEdited?.toDate?.() ||
                (typeof shop.dateLastEdited === "string" ? new Date(shop.dateLastEdited) : new Date());

            // Update all state variables from the loaded shop
            await Promise.all([
                // Update shop details
                setShopDetails({
                    id: shop.id || `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: shop.name || "Unnamed Shop",
                    keeperName: shop.keeperName || "Unknown",
                    type: shop.type || "General Store",
                    location: shop.location || "Unknown Location",
                    description: shop.description || "No details available",
                    keeperDescription: shop.keeperDescription || "No details available",
                    dateCreated: loadedDateCreated,
                    dateLastEdited: loadedDateLastEdited,
                }),

                // Update shop parameters
                setShopState({
                    gold: shop.parameters?.goldAmount || shop.gold || 1000,
                    levelRange: {
                        min: shop.parameters?.levelLow || shop.levelRange?.min || 0,
                        max: shop.parameters?.levelHigh || shop.levelRange?.max || 10,
                    },
                    itemBias: shop.parameters?.shopBias || shop.itemBias || { x: 0.5, y: 0.5 },
                    rarityDistribution: shop.parameters?.rarityDistribution || shop.rarityDistribution || {
                        Common: 95.0,
                        Uncommon: 4.5,
                        Rare: 0.49,
                        Unique: 0.01,
                    },
                    filters: {
                        categories: new Map(shop.filterStates?.categories ? Object.entries(shop.filterStates.categories) : []),
                        subcategories: new Map(shop.filterStates?.subcategories ? Object.entries(shop.filterStates.subcategories) : []),
                        traits: new Map(shop.filterStates?.traits ? Object.entries(shop.filterStates.traits) : []),
                    },
                }),

                // Update inventory
                setItems(shop.currentStock || shop.parameters?.currentStock || [])
            ]);

            // After all state updates are complete, take a snapshot
            const newSnapshot = takeShopSnapshot({
                id: shop.id || `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: shop.name || "Unnamed Shop",
                keeperName: shop.keeperName || "Unknown",
                type: shop.type || "General Store",
                location: shop.location || "Unknown Location",
                description: shop.description || "No details available",
                keeperDescription: shop.keeperDescription || "No details available",
                dateCreated: loadedDateCreated,
                dateLastEdited: loadedDateLastEdited,
            }, {
                gold: shop.parameters?.goldAmount || shop.gold || 1000,
                levelRange: {
                    min: shop.parameters?.levelLow || shop.levelRange?.min || 0,
                    max: shop.parameters?.levelHigh || shop.levelRange?.max || 10,
                },
                itemBias: shop.parameters?.shopBias || shop.itemBias || { x: 0.5, y: 0.5 },
                rarityDistribution: shop.parameters?.rarityDistribution || shop.rarityDistribution || {
                    Common: 95.0,
                    Uncommon: 4.5,
                    Rare: 0.49,
                    Unique: 0.01,
                },
                filters: {
                    categories: new Map(shop.filterStates?.categories ? Object.entries(shop.filterStates.categories) : []),
                    subcategories: new Map(shop.filterStates?.subcategories ? Object.entries(shop.filterStates.subcategories) : []),
                    traits: new Map(shop.filterStates?.traits ? Object.entries(shop.filterStates.traits) : []),
                }
            }, shop.currentStock || shop.parameters?.currentStock || []);

            setShopSnapshot(newSnapshot);
        } catch (error) {
            console.error("Error loading shop:", error);
            alert("Error loading shop. Please try again.");
        }
    };

    const handleNewShop = () => {
        if (hasUnsavedChanges) {
            setPendingAction(() => () => {
                createNewShop();
            });
            setShowUnsavedDialogue(true);
            return;
        }
        createNewShop();
    };

    const createNewShop = async () => {
        try {
            // Generate a new unique ID for the shop
            const newShopId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const currentDate = new Date();

            // Reset all state to initial values
            await Promise.all([
                // Reset shop details
                setShopDetails({
                    id: newShopId,
                    name: "Unnamed Shop",
                    keeperName: "Unknown",
                    type: "General Store",
                    location: "Unknown Location",
                    description: "No details available",
                    keeperDescription: "No details available",
                    dateCreated: currentDate,
                    dateLastEdited: currentDate,
                }),

                // Reset shop parameters
                setShopState({
                    gold: 1000,
                    levelRange: {
                        min: 0,
                        max: 10,
                    },
                    itemBias: { x: 0.5, y: 0.5 },
                    rarityDistribution: {
                        Common: 95.0,
                        Uncommon: 4.5,
                        Rare: 0.49,
                        Unique: 0.01,
                    },
                    filters: {
                        categories: new Map(),
                        subcategories: new Map(),
                        traits: new Map(),
                    },
                }),

                // Reset inventory
                setItems([])
            ]);

            // After all state updates are complete, take a snapshot
            const newSnapshot = takeShopSnapshot({
                id: newShopId,
                name: "Unnamed Shop",
                keeperName: "Unknown",
                type: "General Store",
                location: "Unknown Location",
                description: "No details available",
                keeperDescription: "No details available",
                dateCreated: currentDate,
                dateLastEdited: currentDate,
            }, {
                gold: 1000,
                levelRange: {
                    min: 0,
                    max: 10,
                },
                itemBias: { x: 0.5, y: 0.5 },
                rarityDistribution: {
                    Common: 95.0,
                    Uncommon: 4.5,
                    Rare: 0.49,
                    Unique: 0.01,
                },
                filters: {
                    categories: new Map(),
                    subcategories: new Map(),
                    traits: new Map(),
                }
            }, []);

            setShopSnapshot(newSnapshot);
        } catch (error) {
            console.error("Error creating new shop:", error);
            alert("Error creating new shop. Please try again.");
        }
    };

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

    const handleCloneShop = () => {
        // Generate a new unique ID for the cloned shop
        const clonedShopId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        setShopDetails((prev) => ({
            ...prev,
            id: clonedShopId,
            name: `${prev.name} (Clone)`,
            dateCreated: new Date(),
            dateLastEdited: new Date(),
        }));
    };

    const handleSaveShop = async () => {
        if (!currentUser) {
            alert("Please log in to save shops");
            return;
        }

        try {
            // Convert Map objects to a flat object structure for Firebase
            const filterStatesForStorage = {
                categories: Object.fromEntries(shopState.filters.categories.entries()),
                subcategories: Object.fromEntries(shopState.filters.subcategories.entries()),
                traits: Object.fromEntries(shopState.filters.traits.entries()),
            };

            const savedShopData = {
                id: shopDetails.id,
                name: shopDetails.name,
                keeperName: shopDetails.keeperName,
                type: shopDetails.type,
                location: shopDetails.location,
                description: shopDetails.description,
                keeperDescription: shopDetails.keeperDescription,
                gold: shopState.gold,
                levelRange: {
                    min: shopState.levelRange.min,
                    max: shopState.levelRange.max,
                },
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                currentStock: items,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,
                filterStates: filterStatesForStorage,
            };

            console.log("Saving shop state:", savedShopData);
            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, savedShopData);
            setShopDetails((prev) => ({ ...prev, id: savedShopId }));
            setShopDetails((prev) => ({ ...prev, dateLastEdited: new Date() }));
            
            // Update shop snapshot
            setShopSnapshot(items);
            
            // Reload the shops list after successful save
            await loadShops();
        } catch (error) {
            console.error("Error saving shop:", error);
            alert("Error saving shop. Please try again.");
        }
    };

    const handleDeleteShop = async () => {
        if (!currentUser || !shopDetails.id) {
            alert("Cannot delete shop. Please ensure you are logged in and have a valid shop selected.");
            return;
        }

        try {
            const userId = currentUser.uid;
            await deleteShopData(userId, shopDetails.id);

            // Reset all state
            handleNewShop();

            // Reload the shops list
            await loadShops();

            alert("Shop deleted successfully!");
        } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Error deleting shop. Please try again.");
        }
    };

    /**
     * Loads all shops for the current user from Firebase
     * Called on component mount and after successful saves
     */
    const loadShops = async () => {
        try {
            const userId = currentUser.uid;
            const loadedShops = await loadShopData(userId);
            console.log("Loaded shops:", loadedShops);
            
            // Format the loaded shops to match the expected structure
            const formattedShops = loadedShops.map(shop => ({
                ...shop,
                dateCreated: shop.dateCreated ? new Date(shop.dateCreated) : new Date(),
                dateLastEdited: shop.dateLastEdited ? new Date(shop.dateLastEdited) : new Date()
            }));
            
            console.log("Formatted shops:", formattedShops);
            setSavedShops(formattedShops);
        } catch (error) {
            console.error("Error loading shops:", error);
            alert("Error loading shops. Please try again.");
        }
    };

    // Shop management functions
    const handleGoldChange = (gold) => {
        setShopState((prev) => ({ ...prev, gold }));
    };

    // Lowest level change
    const handleLowestLevelChange = (min) => {
        setShopState((prev) => ({
            ...prev,
            levelRange: { ...prev.levelRange, min },
        }));
    };

    const handleHighestLevelChange = (max) => {
        setShopState((prev) => ({
            ...prev,
            levelRange: { ...prev.levelRange, max },
        }));
    };

    const handleBiasChange = (bias) => {
        setShopState((prev) => ({ ...prev, itemBias: bias }));
    };

    const handleRarityDistributionChange = (distribution) => {
        setShopState((prev) => ({ ...prev, rarityDistribution: distribution }));
    };

    // Shop state synchronization
    useEffect(() => {
        const updateTimeout = setTimeout(() => {
            const newParameters = {
                goldAmount: shopState.gold,
                levelLow: shopState.levelRange.min,
                levelHigh: shopState.levelRange.max,
                shopBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                categories: {
                    included: getFilteredArray("categories", SELECTION_STATES.INCLUDE),
                    excluded: getFilteredArray("categories", SELECTION_STATES.EXCLUDE),
                },
                subcategories: {
                    included: getFilteredArray("subcategories", SELECTION_STATES.INCLUDE),
                    excluded: getFilteredArray("subcategories", SELECTION_STATES.EXCLUDE),
                },
                traits: {
                    included: getFilteredArray("traits", SELECTION_STATES.INCLUDE),
                    excluded: getFilteredArray("traits", SELECTION_STATES.EXCLUDE),
                },
                currentStock: items,
            };

            console.log("Updated parameters:", newParameters);
        }, 100); // Debounce updates

        return () => clearTimeout(updateTimeout);
    }, [
        shopState.gold,
        shopState.levelRange.min,
        shopState.levelRange.max,
        shopState.itemBias,
        shopState.rarityDistribution,
        shopState.filters.categories,
        shopState.filters.subcategories,
        shopState.filters.traits,
        items,
        getFilteredArray,
    ]);

    const handleAiAssistantChange = (newState) => {
        console.log("Ai Assistant state updated:", newState);
    };

    const handleResetChanges = async () => {
        if (!shopSnapshot) return;

        try {
            // Reset all state to match the snapshot
            await Promise.all([
                setShopDetails({
                    id: shopSnapshot.id,
                    name: shopSnapshot.name,
                    keeperName: shopSnapshot.keeperName,
                    type: shopSnapshot.type,
                    location: shopSnapshot.location,
                    description: shopSnapshot.description,
                    keeperDescription: shopSnapshot.keeperDescription,
                    dateCreated: shopSnapshot.dateCreated,
                    dateLastEdited: shopSnapshot.dateLastEdited,
                }),

                setShopState({
                    gold: shopSnapshot.gold,
                    levelRange: shopSnapshot.levelRange,
                    itemBias: shopSnapshot.itemBias,
                    rarityDistribution: shopSnapshot.rarityDistribution,
                    filters: {
                        categories: new Map(shopSnapshot.filters.categories),
                        subcategories: new Map(shopSnapshot.filters.subcategories),
                        traits: new Map(shopSnapshot.filters.traits),
                    },
                }),

                setItems(shopSnapshot.currentStock)
            ]);
        } catch (error) {
            console.error("Error resetting changes:", error);
            alert("Error resetting changes. Please try again.");
        }
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
                                            categoryStates={shopState.filters.categories}
                                            subcategoryStates={shopState.filters.subcategories}
                                            traitStates={shopState.filters.traits}
                                            getFilterState={getFilterState}
                                            toggleCategory={toggleCategory}
                                            toggleSubcategory={toggleSubcategory}
                                            toggleTrait={toggleTrait}
                                            clearCategorySelections={clearCategorySelections}
                                            clearSubcategorySelections={clearSubcategorySelections}
                                            clearTraitSelections={clearTraitSelections}
                                            setCategoryStates={(newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        categories: newStates,
                                                    },
                                                }));
                                            }}
                                            setSubcategoryStates={(newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        subcategories: newStates,
                                                    },
                                                }));
                                            }}
                                            setTraitStates={(newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        traits: newStates,
                                                    },
                                                }));
                                            }}
                                        />
                                    );
                                case "Tab_InventoryTable":
                                    return (
                                        <Tab_InventoryTable
                                            key={tab.key}
                                            type={{ name: "Tab_InventoryTable" }}
                                            items={items}
                                            currentShopName={shopDetails.name}
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
                                            currentShopId={shopDetails.id}
                                        />
                                    );
                                case "Tab_ShopDetails":
                                    return (
                                        <Tab_ShopDetails
                                            key={tab.key}
                                            type={{ name: "Tab_ShopDetails" }}
                                            currentShop={{
                                                id: shopDetails.id,
                                                name: shopDetails.name,
                                                keeperName: shopDetails.keeperName,
                                                type: shopDetails.type,
                                                location: shopDetails.location,
                                                description: shopDetails.description,
                                                keeperDescription: shopDetails.keeperDescription,
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited
                                            }}
                                            onShopDetailsChange={handleShopDetailsChange}
                                            onSaveShop={handleSaveShop}
                                            onCloneShop={handleCloneShop}
                                            onDeleteShop={handleDeleteShop}
                                            onResetChanges={handleResetChanges}
                                            savedShops={savedShops}
                                            hasUnsavedChanges={hasUnsavedChanges}
                                            changes={getChangedFields()}
                                        />
                                    );
                                case "Tab_AiAssistant":
                                    return (
                                        <Tab_AiAssistant
                                            key={tab.key}
                                            type={{ name: "Tab_AiAssistant" }}
                                            currentShop={{
                                                id: shopDetails.id,
                                                name: shopDetails.name,
                                                keeperName: shopDetails.keeperName,
                                                type: shopDetails.type,
                                                location: shopDetails.location,
                                                description: shopDetails.description,
                                                keeperDescription: shopDetails.keeperDescription,
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited
                                            }}
                                            onAiAssistantChange={handleAiAssistantChange}
                                        />
                                    );
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
                        categoryStates={shopState.filters.categories}
                        subcategoryStates={shopState.filters.subcategories}
                        traitStates={shopState.filters.traits}
                        getFilterState={getFilterState}
                        toggleCategory={toggleCategory}
                        toggleSubcategory={toggleSubcategory}
                        toggleTrait={toggleTrait}
                        clearCategorySelections={clearCategorySelections}
                        clearSubcategorySelections={clearSubcategorySelections}
                        clearTraitSelections={clearTraitSelections}
                        setCategoryStates={(newStates) => {
                            setShopState((prev) => ({
                                ...prev,
                                filters: {
                                    ...prev.filters,
                                    categories: newStates,
                                },
                            }));
                        }}
                        setSubcategoryStates={(newStates) => {
                            setShopState((prev) => ({
                                ...prev,
                                filters: {
                                    ...prev.filters,
                                    subcategories: newStates,
                                },
                            }));
                        }}
                        setTraitStates={(newStates) => {
                            setShopState((prev) => ({
                                ...prev,
                                filters: {
                                    ...prev.filters,
                                    traits: newStates,
                                },
                            }));
                        }}
                    />,
                    <Tab_InventoryTable
                        key="Tab_InventoryTable-0"
                        type={{ name: "Tab_InventoryTable" }}
                        items={items}
                        currentShopName={shopDetails.name}
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
                        currentShopId={shopDetails.id}
                    />,
                    <Tab_ShopDetails
                        key="Tab_ShopDetails-0"
                        type={{ name: "Tab_ShopDetails" }}
                        currentShop={{
                            id: shopDetails.id,
                            name: shopDetails.name,
                            keeperName: shopDetails.keeperName,
                            type: shopDetails.type,
                            location: shopDetails.location,
                            description: shopDetails.description,
                            keeperDescription: shopDetails.keeperDescription,
                            dateCreated: shopDetails.dateCreated,
                            dateLastEdited: shopDetails.dateLastEdited
                        }}
                        onShopDetailsChange={handleShopDetailsChange}
                        onSaveShop={handleSaveShop}
                        onCloneShop={handleCloneShop}
                        onDeleteShop={handleDeleteShop}
                        onResetChanges={handleResetChanges}
                        savedShops={savedShops}
                        hasUnsavedChanges={hasUnsavedChanges}
                        changes={getChangedFields()}
                    />,
                    <Tab_AiAssistant
                        key="Tab_AiAssistant-0"
                        type={{ name: "Tab_AiAssistant" }}
                        currentShop={{
                            id: shopDetails.id,
                            name: shopDetails.name,
                            keeperName: shopDetails.keeperName,
                            type: shopDetails.type,
                            location: shopDetails.location,
                            description: shopDetails.description,
                            keeperDescription: shopDetails.keeperDescription,
                            dateCreated: shopDetails.dateCreated,
                            dateLastEdited: shopDetails.dateLastEdited
                        }}
                        onAiAssistantChange={handleAiAssistantChange}
                    />,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                            currentShopName={shopDetails.name}
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
                                            categoryStates: shopState.filters.categories,
                                            subcategoryStates: shopState.filters.subcategories,
                                            traitStates: shopState.filters.traits,
                                            getFilterState: getFilterState,
                                            toggleCategory: toggleCategory,
                                            toggleSubcategory: toggleSubcategory,
                                            toggleTrait: toggleTrait,
                                            clearCategorySelections: clearCategorySelections,
                                            clearSubcategorySelections: clearSubcategorySelections,
                                            clearTraitSelections: clearTraitSelections,
                                            setCategoryStates: (newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        categories: newStates,
                                                    },
                                                }));
                                            },
                                            setSubcategoryStates: (newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        subcategories: newStates,
                                                    },
                                                }));
                                            },
                                            setTraitStates: (newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        traits: newStates,
                                                    },
                                                }));
                                            },
                                        });
                                    case "Tab_InventoryTable":
                                        return React.cloneElement(tab, {
                                            items: sortedItems,
                                            sortConfig,
                                            onSort: handleSort,
                                            currentShopName: shopDetails.name,
                                            handleGenerateClick,
                                        });
                                    case "Tab_ShopDetails":
                                        return React.cloneElement(tab, {
                                            currentShop: {
                                                id: shopDetails.id,
                                                name: shopDetails.name,
                                                keeperName: shopDetails.keeperName,
                                                type: shopDetails.type,
                                                location: shopDetails.location,
                                                description: shopDetails.description,
                                                keeperDescription: shopDetails.keeperDescription,
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited
                                            },
                                            onShopDetailsChange: handleShopDetailsChange,
                                            onSaveShop: handleSaveShop,
                                            onCloneShop: handleCloneShop,
                                            onDeleteShop: handleDeleteShop,
                                            onResetChanges: handleResetChanges,
                                            savedShops,
                                            hasUnsavedChanges,
                                            changes: getChangedFields()
                                        });
                                    case "Tab_ChooseShop":
                                        return React.cloneElement(tab, {
                                            savedShops,
                                            onLoadShop: handleLoadShop,
                                            onNewShop: handleNewShop,
                                            currentShopId: shopDetails.id,
                                        });
                                    case "Tab_AiAssistant":
                                        return React.cloneElement(tab, {
                                            currentShop: {
                                                id: shopDetails.id,
                                                name: shopDetails.name,
                                                keeperName: shopDetails.keeperName,
                                                type: shopDetails.type,
                                                location: shopDetails.location,
                                                description: shopDetails.description,
                                                keeperDescription: shopDetails.keeperDescription,
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited
                                            },
                                            onAiAssistantChange: handleAiAssistantChange
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
                    ))}
                </>
            )}
        </div>
    );
}

export default ShopGenerator;
