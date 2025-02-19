import { useState } from 'react';

/**
 * Hook for managing shop parameter state (gold, levels, bias, rarity)
 */
export const useShopState = (initialState) => {
    const [shopState, setShopState] = useState({
        gold: initialState.gold,
        levelRange: initialState.levelRange,
        itemBias: initialState.itemBias,
        rarityDistribution: initialState.rarityDistribution
    });

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

    return {
        shopState,
        setShopState,
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleBiasChange,
        handleRarityDistributionChange
    };
}; 