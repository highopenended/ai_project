import { useState, useCallback } from 'react';
import { SELECTION_STATES } from '../utils/shopGeneratorConstants';

const FILTER_TYPES = {
    categories: 'categories',
    subcategories: 'subcategories',
    traits: 'traits'
};

/**
 * Initializes a new Map from filter data if it's a valid Map, otherwise returns an empty Map
 * @param {Map|any} filterData - The filter data to initialize from
 * @returns {Map} A new Map instance
 */
const initializeFilter = (filterData) => new Map(filterData instanceof Map ? filterData : undefined);

/**
 * Cycles through filter states in the order: IGNORE -> INCLUDE -> EXCLUDE -> IGNORE
 * @param {string} currentState - The current selection state
 * @returns {string} The next selection state
 */
const toggleState = (currentState) => {
    if (currentState === SELECTION_STATES.IGNORE) return SELECTION_STATES.INCLUDE;
    if (currentState === SELECTION_STATES.INCLUDE) return SELECTION_STATES.EXCLUDE;
    return SELECTION_STATES.IGNORE;
};

/**
 * Updates a filter Map with a new state, removing the key if state is IGNORE
 * @param {Map} filterMap - The filter Map to update
 * @param {string} key - The key to update
 * @param {string} state - The new state
 * @returns {Map} A new Map with the updated state
 */
const updateFilterMap = (filterMap, key, state) => {
    const newMap = new Map(filterMap);
    if (state === SELECTION_STATES.IGNORE) {
        newMap.delete(key);
    } else {
        newMap.set(key, state);
    }
    return newMap;
};

/**
 * Custom hook for managing shop filter states (categories, subcategories, traits)
 * @param {Object} initialFilters - Initial filter states
 * @returns {Object} Filter state and operations
 */
export const useShopFilters = (initialFilters = null) => {
    const [filters, setFilters] = useState(() => 
        Object.keys(FILTER_TYPES).reduce((acc, type) => ({
            ...acc,
            [type]: initializeFilter(initialFilters?.[type])
        }), {})
    );

    const getFilterState = useCallback((filterType, key) => {
        const filterMap = filters[filterType];
        if (!filterMap) return SELECTION_STATES.IGNORE;
        return filterMap.get(key) || SELECTION_STATES.IGNORE;
    }, [filters]);

    const updateFilter = useCallback((filterType, key) => {
        const currentState = getFilterState(filterType, key);
        const nextState = toggleState(currentState);

        setFilters(prev => ({
            ...prev,
            [filterType]: updateFilterMap(prev[filterType], key, nextState)
        }));
    }, [getFilterState]);

    const clearFilter = useCallback((filterType) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: new Map()
        }));
    }, []);

    const getFilteredArray = useCallback((filterType, includeState) => {
        const filterMap = filters[filterType];
        if (!filterMap) return [];
        
        return Array.from(filterMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    }, [filters]);

    // Create toggle callbacks
    const toggleCategory = useCallback((key) => updateFilter(FILTER_TYPES.categories, key), [updateFilter]);
    const toggleSubcategory = useCallback((key) => updateFilter(FILTER_TYPES.subcategories, key), [updateFilter]);
    const toggleTrait = useCallback((key) => updateFilter(FILTER_TYPES.traits, key), [updateFilter]);

    // Create clear callbacks
    const clearCategorySelections = useCallback(() => clearFilter(FILTER_TYPES.categories), [clearFilter]);
    const clearSubcategorySelections = useCallback(() => clearFilter(FILTER_TYPES.subcategories), [clearFilter]);
    const clearTraitSelections = useCallback(() => clearFilter(FILTER_TYPES.traits), [clearFilter]);

    return {
        filters,
        setFilters,
        getFilterState,
        updateFilter,
        clearFilter,
        getFilteredArray,
        toggleCategory,
        toggleSubcategory,
        toggleTrait,
        clearCategorySelections,
        clearSubcategorySelections,
        clearTraitSelections
    };
}; 