import { useState, useCallback } from 'react';
import { SELECTION_STATES } from '../utils/shopGeneratorConstants';

/**
 * Hook for managing shop filter states (categories, subcategories, traits)
 */
export const useShopFilters = (initialFilters = null) => {
    const [filters, setFilters] = useState(() => {
        // If initialFilters is provided, use it to initialize the maps
        if (initialFilters) {
            return {
                categories: initialFilters.categories instanceof Map ? 
                    new Map(initialFilters.categories) : new Map(),
                subcategories: initialFilters.subcategories instanceof Map ? 
                    new Map(initialFilters.subcategories) : new Map(),
                traits: initialFilters.traits instanceof Map ? 
                    new Map(initialFilters.traits) : new Map()
            };
        }
        
        // Otherwise, create empty maps for all filter types
        return {
            categories: new Map(),
            subcategories: new Map(),
            traits: new Map()
        };
    });

    const getFilterState = useCallback((filterType, key) => {
        const filterMap = filters[filterType];
        if (!filterMap) return SELECTION_STATES.IGNORE;  // Return IGNORE if filterMap is undefined
        
        return filterMap.get(key) || SELECTION_STATES.IGNORE;
    }, [filters]);

    const updateFilter = useCallback((filterType, key) => {
        const currentState = getFilterState(filterType, key);
        const nextState = toggleState(currentState);

        // Toggle state helper function
        function toggleState(currentState) {
            if (currentState === SELECTION_STATES.IGNORE) return SELECTION_STATES.INCLUDE;
            if (currentState === SELECTION_STATES.INCLUDE) return SELECTION_STATES.EXCLUDE;
            return SELECTION_STATES.IGNORE;
        }

        setFilters(prev => {
            const newFilters = { ...prev };
            const newMap = new Map(newFilters[filterType]);

            if (nextState === SELECTION_STATES.IGNORE) {
                newMap.delete(key);
            } else {
                newMap.set(key, nextState);
            }

            newFilters[filterType] = newMap;
            return newFilters;
        });
    }, [getFilterState]);

    const clearFilter = useCallback((filterType) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: new Map()
        }));
    }, []);

    const toggleCategory = useCallback((category) => updateFilter("categories", category), [updateFilter]);
    const toggleSubcategory = useCallback((subcategory) => updateFilter("subcategories", subcategory), [updateFilter]);
    const toggleTrait = useCallback((trait) => updateFilter("traits", trait), [updateFilter]);

    const clearCategorySelections = useCallback(() => clearFilter("categories"), [clearFilter]);
    const clearSubcategorySelections = useCallback(() => clearFilter("subcategories"), [clearFilter]);
    const clearTraitSelections = useCallback(() => clearFilter("traits"), [clearFilter]);

    const getFilteredArray = useCallback((filterType, includeState) => {
        const filterMap = filters[filterType];
        if (!filterMap) return [];  // Return empty array if filterMap is undefined
        
        return Array.from(filterMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    }, [filters]);

    return {
        filters,
        setFilters,
        getFilterState,
        updateFilter,
        clearFilter,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections,
        getFilteredArray
    };
}; 