import { useEffect, useCallback } from 'react';
import { deleteShopData, saveOrUpdateShopData, loadShopData } from "../utils/firebaseShopUtils";
import { takeShopSnapshot } from "../utils/shopStateUtils";
import { SELECTION_STATES } from "../utils/shopGeneratorConstants";

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
    getFilteredArray
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

    // Helper function to get current parameters state
    const getCurrentParameters = useCallback(() => ({
        gold: shopState.gold,
        levelLow: shopState.levelRange.min,
        levelHigh: shopState.levelRange.max,
        itemBias: shopState.itemBias,
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
    }), [
        shopState.gold,
        shopState.levelRange.min,
        shopState.levelRange.max,
        shopState.itemBias,
        shopState.rarityDistribution,
        items,
        getFilteredArray
    ]);

    // Track shop parameter changes
    useEffect(() => {
        if (shopState.id) {
            const newParameters = getCurrentParameters();
            console.log("Updated parameters:", newParameters);
        }
    }, [
        shopState.id,
        getCurrentParameters
    ]);

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
            const loadedDateCreated = formatDate(shop.dateCreated);
            const loadedDateLastEdited = formatDate(shop.dateLastEdited);

            const newShopState = {
                id: shop.id || generateShopId(),
                name: shop.name || "Unnamed Shop",
                keeperName: shop.keeperName || "Unknown",
                type: shop.type || "General Store",
                location: shop.location || "Unknown Location",
                description: shop.description || "No details available",
                keeperDescription: shop.keeperDescription || "No details available",
                dateCreated: loadedDateCreated,
                dateLastEdited: loadedDateLastEdited,
                gold: shop.parameters?.gold || shop.gold || 1000,
                levelRange: {
                    min: shop.parameters?.levelLow || shop.levelRange?.min || 0,
                    max: shop.parameters?.levelHigh || shop.levelRange?.max || 10,
                },
                itemBias: shop.parameters?.itemBias || shop.itemBias || { x: 0.5, y: 0.5 },
                rarityDistribution: shop.parameters?.rarityDistribution ||
                    shop.rarityDistribution || {
                        Common: 95.0,
                        Uncommon: 4.5,
                        Rare: 0.49,
                        Unique: 0.01,
                    },
            };

            const newFilters = {
                categories: new Map(
                    shop.filterStates?.categories ? Object.entries(shop.filterStates.categories) : []
                ),
                subcategories: new Map(
                    shop.filterStates?.subcategories ? Object.entries(shop.filterStates.subcategories) : []
                ),
                traits: new Map(shop.filterStates?.traits ? Object.entries(shop.filterStates.traits) : []),
            };

            const newItems = shop.currentStock || shop.parameters?.currentStock || [];

            // Update all state variables from the loaded shop
            await Promise.all([
                setShopState(newShopState),
                setFilters(newFilters),
                setItems(newItems),
            ]);

            // Create new snapshot
            createShopSnapshot(newShopState, newFilters, newItems);
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
        handleCloneShop,
        handleSaveShop,
        handleDeleteShop
    };
}; 