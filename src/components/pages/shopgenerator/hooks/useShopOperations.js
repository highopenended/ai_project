import { useEffect, useCallback } from 'react';
import { deleteShopData, saveOrUpdateShopData, loadShopData } from "../utils/firebaseShopUtils";
import { takeShopSnapshot } from "../utils/shopStateUtils";
import { getCurrentShopState } from "./useShopState";
import defaultShopData from "../utils/shopData";

/**
 * Helper function to generate a unique shop ID
 */
const generateShopId = () => `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Custom hook to handle shop operations like loading, cloning, saving, and deleting
 */
export const useShopOperations = ({
    currentUser,
    shopState,
    setShopState,
    filters,
    items,
    setShopSnapshot,
    setSavedShops,
    setFilters,
    setItems,
    getFilteredArray,
    hasUnsavedChanges,
    setPendingAction,
    setShowUnsavedDialogue
}) => {
    // Helper function to create a new shop snapshot
    const createShopSnapshot = useCallback((shopData, filterData, stockData) => {
        const snapshot = takeShopSnapshot(shopData, filterData, stockData);
        setShopSnapshot(snapshot);
    }, [setShopSnapshot]);

    // Helper function to format dates from various sources
    const formatDate = useCallback((dateInput) => {
        if (!dateInput) return new Date();
        return dateInput?.toDate?.() || 
               (typeof dateInput === "string" ? new Date(dateInput) : dateInput);
    }, []);

    // Track shop parameter changes
    useEffect(() => {
        if (shopState.id) {
            const newState = getCurrentShopState(shopState, filters, items, getFilteredArray);
            console.log("Updated shop state:", newState);
        }
    }, [shopState, filters, items, getFilteredArray]);

    /**
     * Create a new shop with default values
     */
    const createNewShop = async () => {
        try {
            const newShopId = generateShopId();
            const currentDate = new Date();
            const newShopState = {
                ...defaultShopData,
                id: newShopId,
                dateCreated: currentDate,
                dateLastEdited: currentDate,
            };

            // Reset all state to initial values
            await Promise.all([
                setShopState(newShopState),
                setFilters({
                    categories: new Map(),
                    subcategories: new Map(),
                    traits: new Map(),
                }),
                setItems([])
            ]);

            // Create new snapshot
            createShopSnapshot(
                newShopState,
                {
                    categories: new Map(),
                    subcategories: new Map(),
                    traits: new Map(),
                },
                []
            );
        } catch (error) {
            console.error("Error creating new shop:", error);
            alert("Error creating new shop. Please try again.");
        }
    };

    /**
     * Handle creating a new shop with unsaved changes check
     */
    const handleNewShop = () => {
        if (hasUnsavedChanges) {
            setPendingAction(() => () => createNewShop());
            setShowUnsavedDialogue(true);
            return;
        }
        createNewShop();
    };

    /**
     * Handle loading a shop with unsaved changes check
     */
    const handleLoadShopWithCheck = (shop) => {
        if (hasUnsavedChanges) {
            setPendingAction(() => () => handleLoadShop(shop));
            setShowUnsavedDialogue(true);
            return;
        }
        handleLoadShop(shop);
    };

    /**
     * Load all shops for the current user
     */
    const handleLoadShops = async () => {
        if (!currentUser) return;
        
        try {
            const userId = currentUser.uid;
            const loadedShops = await loadShopData(userId);
            
            const formattedShops = loadedShops.map((shop) => ({
                ...shop,
                dateCreated: formatDate(shop.dateCreated),
                dateLastEdited: formatDate(shop.dateLastEdited),
            }));

            setSavedShops(formattedShops);
        } catch (error) {
            console.error("Error loading shops:", error);
            alert("Error loading shops. Please try again.");
        }
    };

    /**
     * Load a specific shop's data
     */
    const handleLoadShop = async (shop) => {
        try {
            // Extract parameters with fallbacks
            const {
                parameters = {},
                filterStates = {},
                currentStock = [],
            } = shop;

            // Create base state with defaults
            const baseState = {
                id: shop.id || generateShopId(),
                name: shop.name || "Unnamed Shop",
                keeperName: shop.keeperName || "Unknown",
                type: shop.type || "General Store",
                location: shop.location || "Unknown Location",
                description: shop.description || "No details available",
                keeperDescription: shop.keeperDescription || "No details available",
                dateCreated: formatDate(shop.dateCreated),
                dateLastEdited: formatDate(shop.dateLastEdited),
                gold: parameters.gold || shop.gold || 1000,
                levelRange: {
                    min: parameters.levelLow || shop.levelRange?.min || 0,
                    max: parameters.levelHigh || shop.levelRange?.max || 10,
                },
                itemBias: parameters.itemBias || shop.itemBias || { x: 0.5, y: 0.5 },
                rarityDistribution: parameters.rarityDistribution || shop.rarityDistribution || {
                    Common: 95.0,
                    Uncommon: 4.5,
                    Rare: 0.49,
                    Unique: 0.01,
                }
            };

            // Create filter maps from stored states
            const newFilters = {
                categories: new Map(Object.entries(filterStates.categories || {})),
                subcategories: new Map(Object.entries(filterStates.subcategories || {})),
                traits: new Map(Object.entries(filterStates.traits || {}))
            };

            // Update all state variables
            await Promise.all([
                setShopState(baseState),
                setFilters(newFilters),
                setItems(currentStock)
            ]);

            // Create new snapshot
            createShopSnapshot(baseState, newFilters, currentStock);
        } catch (error) {
            console.error("Error loading shop:", error);
            alert("Error loading shop. Please try again.");
        }
    };

    /**
     * Clone the current shop
     */
    const handleCloneShop = () => {
        const clonedState = {
            ...shopState,
            id: generateShopId(),
            name: `${shopState.name} (Clone)`,
            dateCreated: new Date(),
            dateLastEdited: new Date(),
        };

        setShopState(clonedState);
        createShopSnapshot(clonedState, filters, items);
    };

    /**
     * Save the current shop
     */
    const handleSaveShop = async () => {
        if (!currentUser) {
            alert("Please log in to save shops");
            return;
        }

        try {
            const currentDate = new Date();
            
            // Convert Map objects to a flat object structure for Firebase
            const filterStatesForStorage = {
                categories: Object.fromEntries(filters.categories.entries()),
                subcategories: Object.fromEntries(filters.subcategories.entries()),
                traits: Object.fromEntries(filters.traits.entries()),
            };

            const savedShopData = {
                ...shopState,
                dateLastEdited: currentDate,
                currentStock: items,
                filterStates: filterStatesForStorage,
            };

            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, savedShopData);
            
            const updatedState = {
                ...shopState,
                id: savedShopId,
                dateLastEdited: currentDate
            };

            setShopState(updatedState);
            createShopSnapshot(updatedState, filters, items);
            await handleLoadShops();
        } catch (error) {
            console.error("Error saving shop:", error);
            alert("Error saving shop. Please try again.");
        }
    };

    /**
     * Delete the current shop
     */
    const handleDeleteShop = async () => {
        if (!currentUser || !shopState.id) {
            alert("Cannot delete shop. Please ensure you are logged in and have a valid shop selected.");
            return;
        }

        try {
            const userId = currentUser.uid;
            await deleteShopData(userId, shopState.id);
            await handleLoadShops();
            alert("Shop deleted successfully!");
        } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Error deleting shop. Please try again.");
        }
    };

    return {
        handleLoadShops,
        handleLoadShop,
        handleLoadShopWithCheck,
        handleNewShop,
        handleCloneShop,
        handleSaveShop,
        handleDeleteShop
    };
}; 