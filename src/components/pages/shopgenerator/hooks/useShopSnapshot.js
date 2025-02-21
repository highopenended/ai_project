import { useState, useCallback, useMemo } from 'react';
import { compareShopStates, hasChanges } from '../utils/shopStateUtils';

/**
 * Hook for managing shop snapshots and change detection
 * 
 * Maintains a snapshot of the shop state and provides functionality to detect
 * changes between the current state and the snapshot. Used for tracking unsaved
 * changes and enabling state restoration.
 * 
 * @param {Object} params - The parameters for snapshot management
 * @param {Object} params.shopState - Current shop state (parameters, details, etc.)
 * @param {Object} params.filters - Current filter states for categories, subcategories, and traits
 * @param {Array} params.inventory - Current shop inventory
 * 
 * @returns {Object} Snapshot controls and state
 * @property {Object|null} shopSnapshot - The current shop snapshot
 * @property {Function} setShopSnapshot - Function to update the shop snapshot
 * @property {Function} getChangedFields - Function to get detailed changes between current state and snapshot
 * @property {boolean} hasUnsavedChanges - Whether there are unsaved changes
 */
export const useShopSnapshot = ({ shopState, filterMaps, inventory }) => {
    const [shopSnapshot, setShopSnapshot] = useState(null);

    const getChangedFields = useCallback(() => {
        if (!shopSnapshot) return { basic: {}, parameters: {}, hasInventoryChanged: false };
        
        return compareShopStates(
            {
                ...shopState,
                filterMaps: filterMaps,
                currentStock: inventory
            },
            shopSnapshot
        );
    }, [shopSnapshot, shopState, filterMaps, inventory]);

    const hasUnsavedChanges = useMemo(() => {
        if (!shopSnapshot && shopState) {
            console.log("No snapshot but has shop state - treating as unsaved new shop");
            return true;
        }
        
        const changes = getChangedFields();
        const hasChangeResult = hasChanges(changes);
        
        console.log("Change detection:", {
            hasSnapshot: !!shopSnapshot,
            hasShopState: !!shopState,
            changes,
            hasChangeResult
        });
        
        return hasChangeResult;
    }, [getChangedFields, shopSnapshot, shopState]);

    return {
        shopSnapshot,
        setShopSnapshot,
        getChangedFields,
        hasUnsavedChanges
    };
}; 