import { useState } from 'react';

/**
 * Hook for managing shop state including parameters and details
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
    };
}; 