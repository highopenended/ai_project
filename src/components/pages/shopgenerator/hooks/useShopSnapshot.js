import { useState, useCallback, useMemo } from 'react';
import { compareShopStates, hasChanges } from '../utils/shopStateUtils';

/**
 * Hook for managing shop snapshots and detecting changes
 */
export const useShopSnapshot = ({ shopDetails, shopState, filters, items }) => {
    const [shopSnapshot, setShopSnapshot] = useState(null);

    const getChangedFields = useCallback(() => {
        if (!shopSnapshot) return { basic: {}, parameters: {}, hasInventoryChanged: false };
        
        return compareShopStates(
            {
                ...shopDetails,
                gold: shopState.gold,
                levelRange: shopState.levelRange,
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                filters: filters,
                currentStock: items
            },
            shopSnapshot
        );
    }, [shopSnapshot, shopDetails, shopState, filters, items]);

    const hasUnsavedChanges = useMemo(() => {
        const changes = getChangedFields();
        return hasChanges(changes);
    }, [getChangedFields]);

    return {
        shopSnapshot,
        setShopSnapshot,
        getChangedFields,
        hasUnsavedChanges
    };
}; 