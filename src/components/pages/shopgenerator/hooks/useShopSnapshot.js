import { useState, useCallback, useMemo } from 'react';
import { compareShopStates, hasChanges } from '../utils/shopStateUtils';

/**
 * Hook for managing shop snapshots and detecting changes
 */
export const useShopSnapshot = ({ shopState, filters, items }) => {
    const [shopSnapshot, setShopSnapshot] = useState(null);

    const getChangedFields = useCallback(() => {
        if (!shopSnapshot) return { basic: {}, parameters: {}, hasInventoryChanged: false };
        
        return compareShopStates(
            {
                ...shopState,
                filters: filters,
                currentStock: items
            },
            shopSnapshot
        );
    }, [shopSnapshot, shopState, filters, items]);

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