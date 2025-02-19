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
export const useShopSnapshot = ({ shopState, filters, inventory }) => {
    const [shopSnapshot, setShopSnapshot] = useState(null);

    const getChangedFields = useCallback(() => {
        if (!shopSnapshot) return { basic: {}, parameters: {}, hasInventoryChanged: false };
        
        return compareShopStates(
            {
                ...shopState,
                filters: filters,
                currentStock: inventory
            },
            shopSnapshot
        );
    }, [shopSnapshot, shopState, filters, inventory]);

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