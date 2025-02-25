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
 * Hook for managing shop CRUD operations
 * 
 * Provides functionality for creating, loading, saving, and deleting shops.
 * Handles user authentication, unsaved changes, and state synchronization
 * between local state and Firebase.
 * 
 * @param {Object} params - The parameters for shop operations
 * @param {Object} params.currentUser - Current authenticated user
 * @param {Object} params.shopState - Current shop state
 * @param {Function} params.setShopState - Function to update shop state
 * @param {Object} params.filterMaps - Current filter states
 * @param {Array} params.inventory - Current shop inventory
 * @param {Function} params.setInventory - Function to update inventory
 * @param {Function} params.setShopSnapshot - Function to update shop snapshot
 * @param {Function} params.setSavedShops - Function to update list of saved shops
 * @param {Function} params.setFilterMaps - Function to update filter states
 * @param {Function} params.getFilteredArray - Function to get filtered arrays
 * @param {boolean} params.hasUnsavedChanges - Whether there are unsaved changes
 * 
 * @returns {Object} Shop operation handlers
 * @property {Function} handleLoadShopList - Load all shops for current user
 * @property {Function} handleNewShop - Create a new shop
 * @property {Function} handleCloneShop - Clone the current shop
 * @property {Function} handleSaveShop - Save the current shop
 * @property {Function} handleDeleteShop - Delete the current shop
 */
export const useShopOperations = ({
    currentUser,
    shopState,
    setShopState,
    filterMaps,
    inventory,
    setShopSnapshot,
    setSavedShops,
    setFilterMaps,
    setInventory,
    getFilteredArray,
    hasUnsavedChanges,
    
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
            const newState = getCurrentShopState(shopState, filterMaps, inventory, getFilteredArray);
            console.log("Updated shop state:", newState);
        }
    }, [shopState, filterMaps, inventory, getFilteredArray]);

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
                setFilterMaps({
                    categories: new Map(),
                    subcategories: new Map(),
                    traits: new Map(),
                }),
                setInventory([])
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
            createNewShop();
            return;
        }
        createNewShop();
    };

    /**
     * Load all shops for the current user
     */
    const handleLoadShopList = async () => {
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
                filterStorageObjects = {},
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
                categories: new Map(Object.entries(filterStorageObjects.categories || {})),
                subcategories: new Map(Object.entries(filterStorageObjects.subcategories || {})),
                traits: new Map(Object.entries(filterStorageObjects.traits || {}))
            };

            // Update all state variables
            await Promise.all([
                setShopState(baseState),
                setFilterMaps(newFilters),
                setInventory(currentStock)
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
        createShopSnapshot(clonedState, filterMaps, inventory);
    };

    /**
     * Save the current shop
     */
    const handleSaveShop = async () => {
        console.log("handleSaveShop called - Starting save process", {
            isUserLoggedIn: !!currentUser,
            hasCurrentUser: !!currentUser,
            currentShopState: shopState,
            currentFilters: filterMaps,
            itemsCount: inventory?.length
        });

        if (!currentUser) {
            console.log("Save failed: User not logged in");
            alert("Please log in to save shops");
            return;
        }

        try {
            console.log("Starting save operation");
            const currentDate = new Date();
            
            // Create a clean copy of shop data without the filters field
            const cleanShopState = { ...shopState };
            delete cleanShopState.filters;

            // Ensure we have a valid ID before saving
            if (!cleanShopState.id || cleanShopState.id === '') {
                cleanShopState.id = generateShopId();
            }

            // Ensure we're not passing any Map objects to Firebase
            const savedShopData = {
                ...cleanShopState,
                dateLastEdited: currentDate,
                currentStock: inventory,
                filterStorageObjects: {
                    categories: Object.fromEntries(filterMaps.categories.entries()),
                    subcategories: Object.fromEntries(filterMaps.subcategories.entries()),
                    traits: Object.fromEntries(filterMaps.traits.entries()),
                },
            };

            console.log("About to call saveOrUpdateShopData with:", {
                userId: currentUser.uid,
                savedShopData
            });

            const savedShopId = await saveOrUpdateShopData(currentUser.uid, savedShopData);
            
            console.log("Shop saved successfully", { savedShopId });

            const updatedState = {
                ...shopState,
                id: savedShopId,
                dateLastEdited: currentDate
            };

            console.log("Updating local state after save");
            setShopState(updatedState);
            createShopSnapshot(updatedState, filterMaps, inventory);
            await handleLoadShopList();
            console.log("Save process completed successfully");
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
            
            // Reload the shop list
            await handleLoadShopList();
            
            // Get the updated list of shops
            const loadedShops = await loadShopData(userId);
            
            // If there are remaining shops, load the first one
            if (loadedShops && loadedShops.length > 0) {
                console.log("deletion", "Loading first available shop after deletion");
                await handleLoadShop(loadedShops[0]);
            } else {
                // If no shops remain, create a new one
                console.log("deletion", "No shops remain, creating new one");
                await handleNewShop();
            }
        } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Error deleting shop. Please try again.");
        }
    };

    return {
        handleLoadShopList,
        handleLoadShop,
        handleNewShop,
        handleCloneShop,
        handleSaveShop,
        handleDeleteShop
    };
}; 