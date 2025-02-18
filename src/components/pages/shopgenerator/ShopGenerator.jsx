import React from "react";
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
        ...defaultShopData,
        // Ensure new Maps are created for filters
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
        setHasUnsavedChanges(true);
    };

    const clearFilter = (filterType) => {
        setShopState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filterType]: new Map(),
            },
        }));
        setHasUnsavedChanges(true);
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

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Unsaved changes state
    const [savedShops, setSavedShops] = useState([]); // List of saved shops
    const [showUnsavedDialogue, setShowUnsavedDialogue] = useState(false); // Dialogue state
    const [pendingAction, setPendingAction] = useState(null); // Pending action state (allows for async operations like unsaved dialogue)

    // Original values state for change tracking
    const [originalValues, setOriginalValues] = useState({
        // Basic shop information
        id: "",
        name: "Unnamed Shop",
        keeperName: "Unknown",
        type: "General Store",
        location: "Unknown Location",
        description: "No details available",
        keeperDescription: "No details available",
        dateCreated: new Date(),
        dateLastEdited: new Date(),

        // Shop generation settings
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

        // Filter states
        filters: {
            categories: new Map(),
            subcategories: new Map(),
            traits: new Map(),
        },

        // Current inventory (maintained separately for performance)
        currentStock: [],

        // Additional tracking fields not in template but needed for UI
        hasInventoryChanged: false,
    });

    // Add this before the return statement
    useEffect(() => {
        console.log("Current shop state values:", {
            dateCreated: shopDetails.dateCreated instanceof Date,
            dateLastEdited: shopDetails.dateLastEdited instanceof Date,
            filters: {
                categories: Array.from(shopState.filters.categories.entries()),
                subcategories: Array.from(shopState.filters.subcategories.entries()),
                traits: Array.from(shopState.filters.traits.entries()),
            },
        });
    }, [shopDetails.dateCreated, shopDetails.dateLastEdited, shopState.filters]);


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
                shortData: {
                    shopName: shopDetails.name,
                    shopKeeperName: shopDetails.keeperName,
                    type: shopDetails.type,
                    location: shopDetails.location,
                },
                longData: {
                    shopDetails: shopDetails.description,
                    shopKeeperDetails: shopDetails.keeperDescription,
                },
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

    // Function to get changed fields
    const getChangedFields = () => {
        const changes = {
            basic: {},
            parameters: {},
            hasInventoryChanged: originalValues.hasInventoryChanged,
        };

        // Check basic fields
        if (shopDetails.name !== originalValues.name)
            changes.basic.shopName = { old: originalValues.name, new: shopDetails.name };
        if (shopDetails.keeperName !== originalValues.keeperName)
            changes.basic.shopKeeperName = { old: originalValues.keeperName, new: shopDetails.keeperName };
        if (shopDetails.type !== originalValues.type)
            changes.basic.shopType = { old: originalValues.type, new: shopDetails.type };
        if (shopDetails.location !== originalValues.location)
            changes.basic.shopLocation = { old: originalValues.location, new: shopDetails.location };
        if (shopDetails.description !== originalValues.description)
            changes.basic.shopDetails = { old: originalValues.description, new: shopDetails.description };
        if (shopDetails.keeperDescription !== originalValues.keeperDescription)
            changes.basic.shopKeeperDetails = {
                old: originalValues.keeperDescription,
                new: shopDetails.keeperDescription,
            };

        // Check parameters
        if (shopState.gold !== originalValues.gold)
            changes.parameters.currentGold = { old: originalValues.gold, new: shopState.gold };
        if (shopState.levelRange.min !== originalValues.levelRange.min)
            changes.parameters.lowestLevel = {
                old: originalValues.levelRange.min,
                new: shopState.levelRange.min,
            };
        if (shopState.levelRange.max !== originalValues.levelRange.max)
            changes.parameters.highestLevel = {
                old: originalValues.levelRange.max,
                new: shopState.levelRange.max,
            };

        // Check itemBias
        if (
            shopState.itemBias.x !== originalValues.itemBias.x ||
            shopState.itemBias.y !== originalValues.itemBias.y
        ) {
            changes.parameters.itemBias = {
                old: originalValues.itemBias,
                new: shopState.itemBias,
            };
        }

        // Check rarity distribution
        const hasRarityChanged = Object.keys(shopState.rarityDistribution).some(
            (key) => shopState.rarityDistribution[key] !== originalValues.rarityDistribution[key]
        );
        if (hasRarityChanged) {
            changes.parameters.rarityDistribution = {
                old: originalValues.rarityDistribution,
                new: shopState.rarityDistribution,
            };
        }

        return changes;
    };

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
            setHasUnsavedChanges(true);
            setOriginalValues((prev) => ({
                ...prev,
                hasInventoryChanged: true,
            }));
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
        setHasUnsavedChanges(true);
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

    const loadShopInternal = (shop) => {
        // Convert date strings or Firebase Timestamps to JavaScript Dates
        const loadedDateCreated =
            shop.dateCreated?.toDate?.() ||
            (typeof shop.dateCreated === "string" ? new Date(shop.dateCreated) : new Date());
        const loadedDateLastEdited =
            shop.dateLastEdited?.toDate?.() ||
            (typeof shop.dateLastEdited === "string" ? new Date(shop.dateLastEdited) : new Date());

        // Update all state variables from the loaded shop
        setShopDetails((prev) => ({
            ...prev,
            id: shop.id || `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: shop.shortData.shopName || "Unnamed Shop",
            keeperName: shop.shortData.shopKeeperName || "Unknown",
            type: shop.shortData.type || "General Store",
            location: shop.shortData.location || "Unknown Location",
            description: shop.longData.shopDetails || "No details available",
            keeperDescription: shop.longData.shopKeeperDetails || "No details available",
            dateCreated: loadedDateCreated,
            dateLastEdited: loadedDateLastEdited,
        }));

        // Update shop parameters with filter states
        const newShopParameters = {
            gold: shop.parameters?.goldAmount || 1000,
            levelRange: {
                min: shop.parameters?.levelLow || 0,
                max: shop.parameters?.levelHigh || 10,
            },
            itemBias: shop.parameters?.shopBias || { x: 0.5, y: 0.5 },
            rarityDistribution: shop.parameters?.rarityDistribution || {
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
        };

        // Load filter states from saved shop
        if (shop.filterStates) {
            // If we have the new format, use it
            Object.entries(shop.filterStates).forEach(([filterType, entries]) => {
                newShopParameters.filters[filterType] = new Map(entries);
            });
        } else {
            // If loading an older shop without filter states, try to restore from parameters
            shop.parameters?.categories?.included?.forEach((category) =>
                newShopParameters.filters.categories.set(category, SELECTION_STATES.INCLUDE)
            );
            shop.parameters?.categories?.excluded?.forEach((category) =>
                newShopParameters.filters.categories.set(category, SELECTION_STATES.EXCLUDE)
            );

            shop.parameters?.subcategories?.included?.forEach((subcategory) =>
                newShopParameters.filters.subcategories.set(subcategory, SELECTION_STATES.INCLUDE)
            );
            shop.parameters?.subcategories?.excluded?.forEach((subcategory) =>
                newShopParameters.filters.subcategories.set(subcategory, SELECTION_STATES.EXCLUDE)
            );

            shop.parameters?.traits?.included?.forEach((trait) =>
                newShopParameters.filters.traits.set(trait, SELECTION_STATES.INCLUDE)
            );
            shop.parameters?.traits?.excluded?.forEach((trait) =>
                newShopParameters.filters.traits.set(trait, SELECTION_STATES.EXCLUDE)
            );
        }

        setShopState(newShopParameters);
        setItems(shop.currentStock || []);

        // Set original values for change tracking
        setOriginalValues({
            // Basic shop information
            id: shop.id || `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: shop.shortData.shopName || "Unnamed Shop",
            keeperName: shop.shortData.shopKeeperName || "Unknown",
            type: shop.shortData.type || "General Store",
            location: shop.shortData.location || "Unknown Location",
            description: shop.longData.shopDetails || "No details available",
            keeperDescription: shop.longData.shopKeeperDetails || "No details available",
            dateCreated: loadedDateCreated,
            dateLastEdited: loadedDateLastEdited,

            // Shop generation settings
            gold: shop.parameters?.goldAmount || 1000,
            levelRange: {
                min: shop.parameters?.levelLow || 0,
                max: shop.parameters?.levelHigh || 10,
            },
            itemBias: shop.parameters?.shopBias || { x: 0.5, y: 0.5 },
            rarityDistribution: shop.parameters?.rarityDistribution || {
                Common: 95.0,
                Uncommon: 4.5,
                Rare: 0.49,
                Unique: 0.01,
            },

            // Filter states
            filters: {
                categories: new Map(shop.parameters?.categories?.included?.map((c) => [c, SELECTION_STATES.INCLUDE]) || new Map()),
                subcategories: new Map(shop.parameters?.subcategories?.included?.map((c) => [c, SELECTION_STATES.INCLUDE]) || new Map()),
                traits: new Map(shop.parameters?.traits?.included?.map((c) => [c, SELECTION_STATES.INCLUDE]) || new Map()),
            },

            // Current inventory (maintained separately for performance)
            currentStock: [...(shop.currentStock || [])],

            // Additional tracking fields not in template but needed for UI
            hasInventoryChanged: false
        });

        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
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

    const createNewShop = () => {
        // Generate a new unique ID for the shop
        const newShopId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Reset all state to initial values
        setShopDetails((prev) => ({
            ...prev,
            id: newShopId,
            name: "Unnamed Shop",
            keeperName: "Unknown",
            type: "General Store",
            location: "Unknown Location",
            description: "No details available",
            keeperDescription: "No details available",
            dateCreated: new Date(),
            dateLastEdited: new Date(),
        }));

        // Reset shop parameters to defaults
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
        });

        setItems([]);

        // Reset original values
        setOriginalValues({
            shopName: "Unnamed Shop",
            shopKeeperName: "Unknown",
            shopType: "General Store",
            shopLocation: "Unknown Location",
            shopDetails: "No details available",
            shopKeeperDetails: "No details available",
            shopParameters: {
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
            },
            hasInventoryChanged: false,
            items: [],
        });

        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
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
            const savedShopData = {
                id: shopDetails.id,
                shortData: {
                    shopName: shopDetails.name,
                    shopKeeperName: shopDetails.keeperName,
                    type: shopDetails.type,
                    location: shopDetails.location,
                },
                longData: {
                    shopDetails: shopDetails.description,
                    shopKeeperDetails: shopDetails.keeperDescription,
                },
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

            console.log("Saving shop state:", savedShopData);
            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, savedShopData);
            setShopDetails((prev) => ({ ...prev, id: savedShopId }));
            setShopDetails((prev) => ({ ...prev, dateLastEdited: new Date() }));
            
            // Update original values to match current state
            setOriginalValues({
                // Basic shop information
                id: shopDetails.id,
                name: shopDetails.name,
                keeperName: shopDetails.keeperName,
                type: shopDetails.type,
                location: shopDetails.location,
                description: shopDetails.description,
                keeperDescription: shopDetails.keeperDescription,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,

                // Shop generation settings
                gold: shopState.gold,
                levelRange: {
                    min: shopState.levelRange.min,
                    max: shopState.levelRange.max,
                },
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,

                // Filter states
                filters: {
                    categories: new Map(shopState.filters.categories),
                    subcategories: new Map(shopState.filters.subcategories),
                    traits: new Map(shopState.filters.traits),
                },

                // Current inventory (maintained separately for performance)
                currentStock: [...items],

                // Additional tracking fields not in template but needed for UI
                hasInventoryChanged: false
            });
            
            setHasUnsavedChanges(false);

            console.log("Shop saved with ID:", savedShopId);
            alert("Shop saved successfully!");

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

    // Update handleResetChanges to use new structure
    const handleResetChanges = () => {
        if (hasUnsavedChanges) {
            // Reset all state values to their original values
            setShopDetails((prev) => ({
                ...prev,
                name: originalValues.name,
                keeperName: originalValues.keeperName,
                type: originalValues.type,
                location: originalValues.location,
                description: originalValues.description,
                keeperDescription: originalValues.keeperDescription,
                dateCreated: originalValues.dateCreated,
                dateLastEdited: originalValues.dateLastEdited,
            }));

            // Reset shop parameters
            setShopState((prev) => ({
                ...prev,
                gold: originalValues.gold,
                levelRange: originalValues.levelRange,
                itemBias: originalValues.itemBias,
                rarityDistribution: originalValues.rarityDistribution,
                filters: {
                    categories: new Map(originalValues.filters.categories),
                    subcategories: new Map(originalValues.filters.subcategories),
                    traits: new Map(originalValues.filters.traits),
                },
            }));

            // Reset inventory if it was changed
            if (originalValues.hasInventoryChanged) {
                setItems(originalValues.currentStock || []);
            }

            // Reset unsaved changes flag
            setHasUnsavedChanges(false);
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

    // Shop management functions
    const handleGoldChange = (gold) => {
        setShopState((prev) => ({ ...prev, gold }));
        setHasUnsavedChanges(true);
    };

    // Lowest level change
    const handleLowestLevelChange = (min) => {
        setShopState((prev) => ({
            ...prev,
            levelRange: { ...prev.levelRange, min },
        }));
        setHasUnsavedChanges(true);
    };

    const handleHighestLevelChange = (max) => {
        setShopState((prev) => ({
            ...prev,
            levelRange: { ...prev.levelRange, max },
        }));
        setHasUnsavedChanges(true);
    };

    const handleBiasChange = (bias) => {
        setShopState((prev) => ({ ...prev, itemBias: bias }));
        setHasUnsavedChanges(true);
    };

    const handleRarityDistributionChange = (distribution) => {
        setShopState((prev) => ({ ...prev, rarityDistribution: distribution }));
        setHasUnsavedChanges(true);
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
                                                setHasUnsavedChanges(true);
                                            }}
                                            setSubcategoryStates={(newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        subcategories: newStates,
                                                    },
                                                }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            setTraitStates={(newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        traits: newStates,
                                                    },
                                                }));
                                                setHasUnsavedChanges(true);
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
                                                shortData: {
                                                    shopName: shopDetails.name,
                                                    shopKeeperName: shopDetails.keeperName,
                                                    type: shopDetails.type,
                                                    location: shopDetails.location,
                                                },
                                                longData: {
                                                    shopDetails: shopDetails.description,
                                                    shopKeeperDetails: shopDetails.keeperDescription,
                                                },
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited,
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
                                                shortData: {
                                                    shopName: shopDetails.name,
                                                    shopKeeperName: shopDetails.keeperName,
                                                    type: shopDetails.type,
                                                    location: shopDetails.location,
                                                },
                                                longData: {
                                                    shopDetails: shopDetails.description,
                                                    shopKeeperDetails: shopDetails.keeperDescription,
                                                },
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited,
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
                            setHasUnsavedChanges(true);
                        }}
                        setSubcategoryStates={(newStates) => {
                            setShopState((prev) => ({
                                ...prev,
                                filters: {
                                    ...prev.filters,
                                    subcategories: newStates,
                                },
                            }));
                            setHasUnsavedChanges(true);
                        }}
                        setTraitStates={(newStates) => {
                            setShopState((prev) => ({
                                ...prev,
                                filters: {
                                    ...prev.filters,
                                    traits: newStates,
                                },
                            }));
                            setHasUnsavedChanges(true);
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
                            shortData: {
                                shopName: shopDetails.name,
                                shopKeeperName: shopDetails.keeperName,
                                type: shopDetails.type,
                                location: shopDetails.location,
                            },
                            longData: {
                                shopDetails: shopDetails.description,
                                shopKeeperDetails: shopDetails.keeperDescription,
                            },
                            dateCreated: shopDetails.dateCreated,
                            dateLastEdited: shopDetails.dateLastEdited,
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
                            shortData: {
                                shopName: shopDetails.name,
                                shopKeeperName: shopDetails.keeperName,
                                type: shopDetails.type,
                                location: shopDetails.location,
                            },
                            longData: {
                                shopDetails: shopDetails.description,
                                shopKeeperDetails: shopDetails.keeperDescription,
                            },
                            dateCreated: shopDetails.dateCreated,
                            dateLastEdited: shopDetails.dateLastEdited,
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
                                                setHasUnsavedChanges(true);
                                            },
                                            setSubcategoryStates: (newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        subcategories: newStates,
                                                    },
                                                }));
                                                setHasUnsavedChanges(true);
                                            },
                                            setTraitStates: (newStates) => {
                                                setShopState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        traits: newStates,
                                                    },
                                                }));
                                                setHasUnsavedChanges(true);
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
                                                shortData: {
                                                    shopName: shopDetails.name,
                                                    shopKeeperName: shopDetails.keeperName,
                                                    type: shopDetails.type,
                                                    location: shopDetails.location,
                                                },
                                                longData: {
                                                    shopDetails: shopDetails.description,
                                                    shopKeeperDetails: shopDetails.keeperDescription,
                                                },
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited,
                                            },
                                            onShopDetailsChange: handleShopDetailsChange,
                                            onSaveShop: handleSaveShop,
                                            onCloneShop: handleCloneShop,
                                            onDeleteShop: handleDeleteShop,
                                            onResetChanges: handleResetChanges,
                                            savedShops: savedShops,
                                            hasUnsavedChanges: hasUnsavedChanges,
                                            changes: getChangedFields(),
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
                                                shortData: {
                                                    shopName: shopDetails.name,
                                                    shopKeeperName: shopDetails.keeperName,
                                                    type: shopDetails.type,
                                                    location: shopDetails.location,
                                                },
                                                longData: {
                                                    shopDetails: shopDetails.description,
                                                    shopKeeperDetails: shopDetails.keeperDescription,
                                                },
                                                dateCreated: shopDetails.dateCreated,
                                                dateLastEdited: shopDetails.dateLastEdited,
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
