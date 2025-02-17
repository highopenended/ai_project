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
import { useShopGenerator } from "./utils/shopGeneratorContext";
import { SELECTION_STATES } from "./utils/shopGeneratorConstants";
import { generateShopInventory } from "./utils/generateShopInventory";
import { saveOrUpdateShopData, loadShopData, deleteShopData } from "./utils/firebaseShopUtils";
import UnsavedChangesDialogue from "./shared/UnsavedChangesDialogue";
import { useSorting } from "./utils/sortingUtils";

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

    // Master list of all possible items
    const [allItems, setAllItems] = useState([]);

    // Shop parameters state
    const [shopParameters, setShopParameters] = useState({
        gold: 1000,
        levelRange: {
            min: 0,
            max: 10
        },
        itemBias: { x: 0.5, y: 0.5 },
        rarityDistribution: {
            Common: 95.0,
            Uncommon: 4.5,
            Rare: 0.49,
            Unique: 0.01,
        }
    });

    // Shop inventory state
    const [items, setItems] = useState([]);
    const { sortedItems, sortConfig, handleSort } = useSorting(items);

    console.log("Checking in");

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
        dateLastEdited: new Date()
    });

    // Unsaved changes state
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Shop state management
    const [savedShops, setSavedShops] = useState([]);

    // Get filter states from context
    const { categoryStates, subcategoryStates, traitStates, setCategoryStates, setSubcategoryStates, setTraitStates } =
        useShopGenerator();

    // Dialogue state
    const [showUnsavedDialogue, setShowUnsavedDialogue] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Original values state for change tracking
    const [originalValues, setOriginalValues] = useState({
        shopName: "",
        shopKeeperName: "",
        shopType: "",
        shopLocation: "",
        shopDetails: "",
        shopKeeperDetails: "",
        shopParameters: {
            gold: 1000,
            levelRange: {
                min: 0,
                max: 10
            },
            itemBias: { x: 0.5, y: 0.5 },
            rarityDistribution: {
                Common: 95.0,
                Uncommon: 4.5,
                Rare: 0.49,
                Unique: 0.01,
            }
        },
        hasInventoryChanged: false,
    });

    // Add wrapper functions for filter state changes
    const handleCategoryStatesChange = (newStates) => {
        setCategoryStates(newStates);
        setHasUnsavedChanges(true);
    };

    const handleSubcategoryStatesChange = (newStates) => {
        setSubcategoryStates(newStates);
        setHasUnsavedChanges(true);
    };

    const handleTraitStatesChange = (newStates) => {
        setTraitStates(newStates);
        setHasUnsavedChanges(true);
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
            const shopState = {
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
                    goldAmount: shopParameters.gold,
                    levelLow: shopParameters.levelRange.min,
                    levelHigh: shopParameters.levelRange.max,
                    shopBias: shopParameters.itemBias,
                    rarityDistribution: shopParameters.rarityDistribution,
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
                },
                currentStock: items,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,
                filterStates: {
                    categoryStates: Array.from(categoryStates.entries()),
                    subcategoryStates: Array.from(subcategoryStates.entries()),
                    traitStates: Array.from(traitStates.entries()),
                },
            };
            localStorage.setItem("currentShop", JSON.stringify(shopState));
        }
    }, [
        shopDetails.id,
        shopDetails.name,
        shopDetails.keeperName,
        shopDetails.type,
        shopDetails.location,
        shopDetails.description,
        shopDetails.keeperDescription,
        shopParameters.gold,
        shopParameters.levelRange.min,
        shopParameters.levelRange.max,
        shopParameters.itemBias,
        shopParameters.rarityDistribution,
        items,
        shopDetails.dateCreated,
        shopDetails.dateLastEdited,
        categoryStates,
        subcategoryStates,
        traitStates,
    ]);

    // Function to get filtered arrays from Maps
    const getFilteredArray = (stateMap, includeState, defaultMap = new Map()) => {
        if (!stateMap) stateMap = defaultMap;
        return Array.from(stateMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    };

    // Function to get changed fields
    const getChangedFields = () => {
        const changes = {
            basic: {},
            parameters: {},
            hasInventoryChanged: originalValues.hasInventoryChanged,
        };

        // Check basic fields
        if (shopDetails.name !== originalValues.shopName)
            changes.basic.shopName = { old: originalValues.shopName, new: shopDetails.name };
        if (shopDetails.keeperName !== originalValues.shopKeeperName)
            changes.basic.shopKeeperName = { old: originalValues.shopKeeperName, new: shopDetails.keeperName };
        if (shopDetails.type !== originalValues.shopType)
            changes.basic.shopType = { old: originalValues.shopType, new: shopDetails.type };
        if (shopDetails.location !== originalValues.shopLocation)
            changes.basic.shopLocation = { old: originalValues.shopLocation, new: shopDetails.location };
        if (shopDetails.description !== originalValues.shopDetails)
            changes.basic.shopDetails = { old: originalValues.shopDetails, new: shopDetails.description };
        if (shopDetails.keeperDescription !== originalValues.shopKeeperDetails)
            changes.basic.shopKeeperDetails = { old: originalValues.shopKeeperDetails, new: shopDetails.keeperDescription };

        // Check parameters
        if (shopParameters.gold !== originalValues.shopParameters.gold)
            changes.parameters.currentGold = { old: originalValues.shopParameters.gold, new: shopParameters.gold };
        if (shopParameters.levelRange.min !== originalValues.shopParameters.levelRange.min)
            changes.parameters.lowestLevel = { old: originalValues.shopParameters.levelRange.min, new: shopParameters.levelRange.min };
        if (shopParameters.levelRange.max !== originalValues.shopParameters.levelRange.max)
            changes.parameters.highestLevel = { old: originalValues.shopParameters.levelRange.max, new: shopParameters.levelRange.max };

        // Check itemBias
        if (shopParameters.itemBias.x !== originalValues.shopParameters.itemBias.x || shopParameters.itemBias.y !== originalValues.shopParameters.itemBias.y) {
            changes.parameters.itemBias = {
                old: originalValues.shopParameters.itemBias,
                new: shopParameters.itemBias,
            };
        }

        // Check rarity distribution
        const hasRarityChanged = Object.keys(shopParameters.rarityDistribution).some(
            (key) => shopParameters.rarityDistribution[key] !== originalValues.shopParameters.rarityDistribution[key]
        );
        if (hasRarityChanged) {
            changes.parameters.rarityDistribution = {
                old: originalValues.shopParameters.rarityDistribution,
                new: shopParameters.rarityDistribution,
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

        if (!categoryStates || !subcategoryStates || !traitStates) {
            console.error("Filter states not initialized!", {
                categoryStates: !!categoryStates,
                subcategoryStates: !!subcategoryStates,
                traitStates: !!traitStates,
            });
            return;
        }

        console.log("Current state:", {
            currentGold: shopParameters.gold,
            lowestLevel: shopParameters.levelRange.min,
            highestLevel: shopParameters.levelRange.max,
            itemBias: shopParameters.itemBias,
            rarityDistribution: shopParameters.rarityDistribution,
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
            currentGold: shopParameters.gold,
            lowestLevel: shopParameters.levelRange.min,
            highestLevel: shopParameters.levelRange.max,
            itemBias: shopParameters.itemBias,
            rarityDistribution: shopParameters.rarityDistribution,
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

        // Update shop parameters
        const newShopParameters = {
            gold: shop.parameters?.goldAmount || 1000,
            levelRange: {
                min: shop.parameters?.levelLow || 0,
                max: shop.parameters?.levelHigh || 10
            },
            itemBias: shop.parameters?.shopBias || { x: 0.5, y: 0.5 },
            rarityDistribution: shop.parameters?.rarityDistribution || {
                Common: 95.0,
                Uncommon: 4.5,
                Rare: 0.49,
                Unique: 0.01,
            }
        };
        setShopParameters(newShopParameters);
        setItems(shop.currentStock || []);

        // Restore filter states if they exist in the saved shop
        const newFilterStates = {
            categoryStates: shop.filterStates?.categoryStates || [],
            subcategoryStates: shop.filterStates?.subcategoryStates || [],
            traitStates: shop.filterStates?.traitStates || []
        };

        if (shop.filterStates) {
            setCategoryStates(new Map(shop.filterStates.categoryStates));
            setSubcategoryStates(new Map(shop.filterStates.subcategoryStates));
            setTraitStates(new Map(shop.filterStates.traitStates));
        } else {
            // If loading an older shop without filter states, try to restore from parameters
            const categoryMap = new Map();
            shop.parameters?.categories?.included?.forEach((category) =>
                categoryMap.set(category, SELECTION_STATES.INCLUDE)
            );
            shop.parameters?.categories?.excluded?.forEach((category) =>
                categoryMap.set(category, SELECTION_STATES.EXCLUDE)
            );
            setCategoryStates(categoryMap);

            const subcategoryMap = new Map();
            shop.parameters?.subcategories?.included?.forEach((subcategory) =>
                subcategoryMap.set(subcategory, SELECTION_STATES.INCLUDE)
            );
            shop.parameters?.subcategories?.excluded?.forEach((subcategory) =>
                subcategoryMap.set(subcategory, SELECTION_STATES.EXCLUDE)
            );
            setSubcategoryStates(subcategoryMap);

            const traitMap = new Map();
            shop.parameters?.traits?.included?.forEach((trait) => traitMap.set(trait, SELECTION_STATES.INCLUDE));
            shop.parameters?.traits?.excluded?.forEach((trait) => traitMap.set(trait, SELECTION_STATES.EXCLUDE));
            setTraitStates(traitMap);
        }

        // Set original values for change tracking
        setOriginalValues({
            shopName: shop.shortData.shopName || "Unnamed Shop",
            shopKeeperName: shop.shortData.shopKeeperName || "Unknown",
            shopType: shop.shortData.type || "General Store",
            shopLocation: shop.shortData.location || "Unknown Location",
            shopDetails: shop.longData.shopDetails || "No details available",
            shopKeeperDetails: shop.longData.shopKeeperDetails || "No details available",
            shopParameters: newShopParameters,
            hasInventoryChanged: false,
            items: shop.currentStock || [],
            filterStates: newFilterStates
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
        setShopParameters({
            gold: 1000,
            levelRange: {
                min: 0,
                max: 10
            },
            itemBias: { x: 0.5, y: 0.5 },
            rarityDistribution: {
                Common: 95.0,
                Uncommon: 4.5,
                Rare: 0.49,
                Unique: 0.01,
            }
        });

        setItems([]);

        // Clear all filters
        setCategoryStates(new Map());
        setSubcategoryStates(new Map());
        setTraitStates(new Map());

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
                    max: 10
                },
                itemBias: { x: 0.5, y: 0.5 },
                rarityDistribution: {
                    Common: 95.0,
                    Uncommon: 4.5,
                    Rare: 0.49,
                    Unique: 0.01,
                }
            },
            hasInventoryChanged: false,
            items: [],
            filterStates: {
                categoryStates: [],
                subcategoryStates: [],
                traitStates: [],
            },
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
            const shopState = {
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
                    goldAmount: shopParameters.gold,
                    levelLow: shopParameters.levelRange.min,
                    levelHigh: shopParameters.levelRange.max,
                    shopBias: shopParameters.itemBias,
                    rarityDistribution: shopParameters.rarityDistribution,
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
                },
                currentStock: items,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,
            };

            console.log("Saving shop state:", shopState);
            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, shopState);
            setShopDetails((prev) => ({ ...prev, id: savedShopId }));
            setShopDetails((prev) => ({ ...prev, dateLastEdited: new Date() }));
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
                name: originalValues.shopName,
                keeperName: originalValues.shopKeeperName,
                type: originalValues.shopType,
                location: originalValues.shopLocation,
                description: originalValues.shopDetails,
                keeperDescription: originalValues.shopKeeperDetails,
            }));

            // Reset shop parameters
            setShopParameters(originalValues.shopParameters);

            // Reset filter states if they were changed
            if (originalValues.filterStates) {
                setCategoryStates(new Map(originalValues.filterStates.categoryStates));
                setSubcategoryStates(new Map(originalValues.filterStates.subcategoryStates));
                setTraitStates(new Map(originalValues.filterStates.traitStates));
            }

            // Reset inventory if it was changed
            if (originalValues.hasInventoryChanged) {
                setItems(originalValues.items || []);
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
        setShopParameters(prev => ({ ...prev, gold }));
        setHasUnsavedChanges(true);
    };

    const handleLowestLevelChange = (min) => {
        setShopParameters(prev => ({ 
            ...prev, 
            levelRange: { ...prev.levelRange, min }
        }));
        setHasUnsavedChanges(true);
    };

    const handleHighestLevelChange = (max) => {
        setShopParameters(prev => ({ 
            ...prev, 
            levelRange: { ...prev.levelRange, max }
        }));
        setHasUnsavedChanges(true);
    };

    const handleBiasChange = (bias) => {
        setShopParameters(prev => ({ ...prev, itemBias: bias }));
        setHasUnsavedChanges(true);
    };

    const handleRarityDistributionChange = (distribution) => {
        setShopParameters(prev => ({ ...prev, rarityDistribution: distribution }));
        setHasUnsavedChanges(true);
    };

    // Shop state synchronization
    useEffect(() => {
        const updateTimeout = setTimeout(() => {
            const newParameters = {
                goldAmount: shopParameters.gold,
                levelLow: shopParameters.levelRange.min,
                levelHigh: shopParameters.levelRange.max,
                shopBias: shopParameters.itemBias,
                rarityDistribution: shopParameters.rarityDistribution,
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

            console.log("Updated parameters:", newParameters);
        }, 100); // Debounce updates

        return () => clearTimeout(updateTimeout);
    }, [
        shopParameters.gold,
        shopParameters.levelRange.min,
        shopParameters.levelRange.max,
        shopParameters.itemBias,
        shopParameters.rarityDistribution,
        categoryStates,
        subcategoryStates,
        traitStates,
        items,
    ]);

    const handleAiAssistantChange = (newState) => {
        console.log("Ai Assistant state updated:", newState);
    };

    // Update items when sorted items change(causes infinite looping, keep commented out)
    // useEffect(() => {
    //     if (sortedItems !== items) {
    //         setItems(sortedItems);
    //         setHasUnsavedChanges(true);
    //     }
    // }, [sortedItems]);

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
                                            currentGold={shopParameters.gold}
                                            setCurrentGold={handleGoldChange}
                                            lowestLevel={shopParameters.levelRange.min}
                                            setLowestLevel={handleLowestLevelChange}
                                            highestLevel={shopParameters.levelRange.max}
                                            setHighestLevel={handleHighestLevelChange}
                                            rarityDistribution={shopParameters.rarityDistribution}
                                            setRarityDistribution={handleRarityDistributionChange}
                                            itemBias={shopParameters.itemBias}
                                            setItemBias={handleBiasChange}
                                            setCategoryStates={handleCategoryStatesChange}
                                            setSubcategoryStates={handleSubcategoryStatesChange}
                                            setTraitStates={handleTraitStatesChange}
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
                        currentGold={shopParameters.gold}
                        setCurrentGold={handleGoldChange}
                        lowestLevel={shopParameters.levelRange.min}
                        setLowestLevel={handleLowestLevelChange}
                        highestLevel={shopParameters.levelRange.max}
                        setHighestLevel={handleHighestLevelChange}
                        rarityDistribution={shopParameters.rarityDistribution}
                        setRarityDistribution={handleRarityDistributionChange}
                        itemBias={shopParameters.itemBias}
                        setItemBias={handleBiasChange}
                        setCategoryStates={handleCategoryStatesChange}
                        setSubcategoryStates={handleSubcategoryStatesChange}
                        setTraitStates={handleTraitStatesChange}
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

    // Add this before the return statement
    useEffect(() => {
        console.log("Current shop state values:", {
            dateCreated: shopDetails.dateCreated instanceof Date,
            dateLastEdited: shopDetails.dateLastEdited instanceof Date,
        });
    }, [shopDetails.dateCreated, shopDetails.dateLastEdited]);

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
                                            currentGold: shopParameters.gold,
                                            setCurrentGold: handleGoldChange,
                                            lowestLevel: shopParameters.levelRange.min,
                                            setLowestLevel: handleLowestLevelChange,
                                            highestLevel: shopParameters.levelRange.max,
                                            setHighestLevel: handleHighestLevelChange,
                                            rarityDistribution: shopParameters.rarityDistribution,
                                            setRarityDistribution: handleRarityDistributionChange,
                                            itemBias: shopParameters.itemBias,
                                            setItemBias: handleBiasChange,
                                            setCategoryStates: handleCategoryStatesChange,
                                            setSubcategoryStates: handleSubcategoryStatesChange,
                                            setTraitStates: handleTraitStatesChange,
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
