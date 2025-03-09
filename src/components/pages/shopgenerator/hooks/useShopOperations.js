import { useCallback } from 'react';
import { deleteShopData, saveOrUpdateShopData, loadShopData } from "../utils/firebaseShopUtils";
import { takeShopSnapshot } from "../utils/shopStateUtils";
import defaultShopData from "../utils/shopData";
import { serializeShopData, deserializeAiConversations } from '../utils/serializationUtils';
import { useShopCache } from './useShopCache';

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
    setInventory,
    setShopSnapshot,
    setSavedShops,
    setFilterMaps,
    hasUnsavedChanges,
}) => {
    // Initialize shop cache
    const {
        cachedShops,
        updateCache,
        updateShopCache,
        removeFromCache,
        isRefreshNeeded,
        markAsRefreshed
    } = useShopCache(currentUser?.uid);

    // Helper function to create a new shop snapshot
    const createShopSnapshot = useCallback((shopData, filterData, stockData) => {
        const snapshot = takeShopSnapshot(shopData, filterData, stockData);
        setShopSnapshot(snapshot);
    }, [setShopSnapshot]);

    // Helper function to format dates from various sources
    const formatDate = useCallback((dateInput) => {
        if (!dateInput) return new Date();
        
        // Handle Firestore Timestamp objects
        if (dateInput && typeof dateInput.toDate === 'function') {
            return dateInput.toDate();
        }
        
        // Handle string dates or already Date objects
        return typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    }, []);

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
     * Uses cache when available, falls back to Firebase
     */
    const handleLoadShopList = async () => {
        if (!currentUser) return;
        
        try {
            const userId = currentUser.uid;
            
            // Check if we need to refresh from Firebase
            if (cachedShops && !isRefreshNeeded()) {
                console.log('Using cached shop list');
                setSavedShops(cachedShops);
                return;
            }
            
            console.log('Loading shop list from Firebase');
            const loadedShops = await loadShopData(userId);
            
            const formattedShops = loadedShops.map((shop) => ({
                ...shop,
                dateCreated: formatDate(shop.dateCreated),
                dateLastEdited: formatDate(shop.dateLastEdited),
            }));

            // Update state and cache
            setSavedShops(formattedShops);
            updateCache(formattedShops);
            markAsRefreshed();
        } catch (error) {
            console.error("Error loading shops:", error);
            
            // If Firebase fails but we have cached data, use that
            if (cachedShops) {
                console.log('Firebase load failed, using cached data');
                setSavedShops(cachedShops);
            } else {
                alert("Error loading shops. Please try again.");
            }
        }
    };

    /**
     * Load a shop from the saved shops list
     */
    const handleLoadShop = async (shop) => {
        console.log("Loading shop:", shop);
        try {
            // Create a new shop state from the loaded shop
            const newShopState = {
                id: shop.id,
                name: shop.name || defaultShopData.name,
                keeperName: shop.keeperName || defaultShopData.keeperName,
                type: shop.type || defaultShopData.type,
                location: shop.location || defaultShopData.location,
                description: shop.description || defaultShopData.description,
                keeperDescription: shop.keeperDescription || defaultShopData.keeperDescription,
                dateCreated: formatDate(shop.dateCreated) || new Date(),
                dateLastEdited: formatDate(shop.dateLastEdited) || new Date(),
                gold: shop.gold || defaultShopData.gold,
                levelRange: shop.levelRange || defaultShopData.levelRange,
                itemBias: shop.itemBias || defaultShopData.itemBias,
                rarityDistribution: shop.rarityDistribution || defaultShopData.rarityDistribution,
                // Deserialize AI conversations to ensure proper structure
                aiConversations: deserializeAiConversations(shop.aiConversations || [])
            };

            // Create filter maps from stored states
            const newFilters = {
                categories: new Map(Object.entries(shop.filterStorageObjects?.categories || {})),
                subcategories: new Map(Object.entries(shop.filterStorageObjects?.subcategories || {})),
                traits: new Map(Object.entries(shop.filterStorageObjects?.traits || {}))
            };

            // Update all state variables
            await Promise.all([
                setShopState(newShopState),
                setFilterMaps(newFilters),
                setInventory(shop.currentStock || [])
            ]);

            // Create new snapshot
            createShopSnapshot(newShopState, newFilters, shop.currentStock || []);
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
     * Saves to Firebase first, then updates cache on success
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
            
            // Use the serialization utility to create a clean, serializable copy of the shop data
            const savedShopData = serializeShopData(shopState, filterMaps, inventory);
            
            // Ensure we have a valid ID before saving
            if (!savedShopData.id || savedShopData.id === '') {
                savedShopData.id = generateShopId();
            }

            console.log("About to call saveOrUpdateShopData with:", {
                userId: currentUser.uid,
                savedShopData
            });

            // Save to Firebase first
            const savedShopId = await saveOrUpdateShopData(currentUser.uid, savedShopData);
            
            console.log("Shop saved successfully", { savedShopId });

            // Update local state
            const updatedState = {
                ...shopState,
                id: savedShopId,
                dateLastEdited: savedShopData.dateLastEdited
            };

            console.log("Updating local state after save");
            setShopState(updatedState);
            createShopSnapshot(updatedState, filterMaps, inventory);
            
            // Update the shop in cache or add it if it's new
            const updatedShop = {
                ...savedShopData,
                id: savedShopId
            };
            
            // Get current cached shops
            if (cachedShops) {
                const shopExists = cachedShops.some(shop => shop.id === savedShopId);
                
                if (shopExists) {
                    // Update existing shop in cache
                    updateShopCache(updatedShop);
                } else {
                    // Add new shop to cache
                    updateCache([...cachedShops, updatedShop]);
                }
                
                // Update the savedShops state with the cached data
                setSavedShops(
                    shopExists 
                        ? cachedShops.map(shop => shop.id === savedShopId ? updatedShop : shop)
                        : [...cachedShops, updatedShop]
                );
            } else {
                // If no cache exists yet, load from Firebase
                await handleLoadShopList();
            }
            
            console.log("Save process completed successfully");
        } catch (error) {
            console.error("Error saving shop:", error);
            alert("Error saving shop. Please try again.");
        }
    };

    /**
     * Delete the current shop
     * Deletes from Firebase first, then updates cache on success
     */
    const handleDeleteShop = async () => {
        if (!currentUser || !shopState.id) {
            alert("Cannot delete shop. Please ensure you are logged in and have a valid shop selected.");
            return;
        }

        try {
            const userId = currentUser.uid;
            const shopId = shopState.id;
            
            // Delete from Firebase first
            await deleteShopData(userId, shopId);
            console.log("Shop deleted from Firebase with ID:", shopId);
            
            // Remove from cache
            removeFromCache(shopId);
            
            // Update savedShops state
            const updatedShops = cachedShops ? cachedShops.filter(shop => shop.id !== shopId) : [];
            setSavedShops(updatedShops);
            
            // If there are remaining shops, load the first one
            if (updatedShops.length > 0) {
                console.log("Loading first available shop after deletion");
                await handleLoadShop(updatedShops[0]);
            } else {
                // If no shops remain, create a new one
                console.log("No shops remain, creating new one");
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