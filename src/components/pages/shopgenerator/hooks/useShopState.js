import { useState, useCallback } from 'react';
import { SELECTION_STATES } from '../utils/shopGeneratorConstants';

/**
 * Helper function to get current shop state including parameters, details, and filterMaps
 */
export const getCurrentShopState = (shopState, filterMaps, items, getFilteredArray) => ({
    
    // Shop details
    id: shopState.id,
    name: shopState.name,
    keeperName: shopState.keeperName,
    type: shopState.type,
    location: shopState.location,
    description: shopState.description,
    keeperDescription: shopState.keeperDescription,
    dateCreated: shopState.dateCreated,
    dateLastEdited: shopState.dateLastEdited,
    
    // Shop parameters
    gold: shopState.gold,
    levelRange: {
        min: shopState.levelRange.min,
        max: shopState.levelRange.max
    },
    itemBias: shopState.itemBias,
    rarityDistribution: shopState.rarityDistribution,
    
    // Filter states
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
});

/**
 * Hook for managing shop state and parameters
 * 
 * Manages the core shop state including generation parameters, shop details,
 * and provides handlers for updating various aspects of the shop state.
 * 
 * @param {Object} initialState - Initial shop state from defaultShopData
 * 
 * @returns {Object} Shop state and handlers
 * @property {Object} shopState - Current shop state
 * @property {Function} setShopState - Function to update the entire shop state
 * @property {Function} handleGoldChange - Handler for updating shop gold
 * @property {Function} handleLowestLevelChange - Handler for updating minimum level
 * @property {Function} handleHighestLevelChange - Handler for updating maximum level
 * @property {Function} handleBiasChange - Handler for updating item bias
 * @property {Function} handleRarityDistributionChange - Handler for updating rarity distribution
 * @property {Function} handleShopDetailsChange - Handler for updating shop details
 * @property {Function} handleRevertChanges - Handler for resetting state to a snapshot
 */
export const useShopState = (initialState) => {
    const [shopState, setShopState] = useState({
        // Shop parameters
        gold: initialState.gold,
        levelRange: initialState.levelRange,
        itemBias: initialState.itemBias,
        rarityDistribution: initialState.rarityDistribution,
        
        // Shop details
        id: initialState.id || "",
        name: initialState.name || "Unnamed Shop",
        keeperName: initialState.keeperName || "Unknown",
        type: initialState.type || "General Store",
        location: initialState.location || "Unknown Location",
        description: initialState.description || "No details available",
        keeperDescription: initialState.keeperDescription || "No details available",
        dateCreated: initialState.dateCreated || new Date(),
        dateLastEdited: initialState.dateLastEdited || new Date(),
    });

    // Parameter handlers
    const handleGoldChange = (gold) => {
        setShopState(prev => ({ ...prev, gold }));
    };

    const handleLowestLevelChange = (min) => {
        setShopState(prev => ({
            ...prev,
            levelRange: { ...prev.levelRange, min },
        }));
    };

    const handleHighestLevelChange = (max) => {
        setShopState(prev => ({
            ...prev,
            levelRange: { ...prev.levelRange, max },
        }));
    };

    const handleBiasChange = (bias) => {
        setShopState(prev => ({ ...prev, itemBias: bias }));
    };

    const handleRarityDistributionChange = (distribution) => {
        setShopState(prev => ({ ...prev, rarityDistribution: distribution }));
    };

    // Shop details handlers
    const handleShopDetailsChange = (e) => {
        console.log("handleShopDetailsChange called");
        const { name, value } = e.target;
        setShopState(prev => {
            const newState = { ...prev };
            
            switch (name) {
                case "shopName":
                    newState.name = value;
                    break;
                case "shopKeeperName":
                    newState.keeperName = value;
                    break;
                case "type":
                    newState.type = value;
                    break;
                case "location":
                    newState.location = value;
                    break;
                case "shopDetails":
                    newState.description = value;
                    break;
                case "shopKeeperDetails":
                    newState.keeperDescription = value;
                    break;
                default:
                    console.warn("Unknown field name:", name);
                    return prev;
            }
            
            newState.dateLastEdited = new Date();
            return newState;
        });
    };

    /**
     * Reset all state to match the last snapshot
     */
    const handleRevertChanges = useCallback(async (snapshot, setFilterMaps, setItems) => {
        if (!snapshot) return;

        try {
            // Reset all state to match the snapshot
            await Promise.all([
                setShopState({
                    id: snapshot.id,
                    name: snapshot.name,
                    keeperName: snapshot.keeperName,
                    type: snapshot.type,
                    location: snapshot.location,
                    description: snapshot.description,
                    keeperDescription: snapshot.keeperDescription,
                    dateCreated: snapshot.dateCreated,
                    dateLastEdited: snapshot.dateLastEdited,
                    gold: snapshot.gold,
                    levelRange: snapshot.levelRange,
                    itemBias: snapshot.itemBias,
                    rarityDistribution: snapshot.rarityDistribution,
                }),
                setFilterMaps?.({
                    categories: new Map(Object.entries(snapshot.filterStorageObjects.categories)),
                    subcategories: new Map(Object.entries(snapshot.filterStorageObjects.subcategories)),
                    traits: new Map(Object.entries(snapshot.filterStorageObjects.traits)),
                }),
                setItems?.(snapshot.currentStock),
            ]);
        } catch (error) {
            console.error("Error resetting changes:", error);
            alert("Error resetting changes. Please try again.");
        }
    }, []);

    return {
        shopState,
        setShopState,
        // Parameter handlers
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleBiasChange,
        handleRarityDistributionChange,
        // Shop details handlers
        handleShopDetailsChange,
        // Reset handler
        handleRevertChanges,
    };
}; 