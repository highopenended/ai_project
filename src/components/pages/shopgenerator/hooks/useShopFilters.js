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
 * Hook for managing shop inventory filters
 * 
 * Manages the filter states for categories, subcategories, and traits. Each filter
 * can be in one of three states: IGNORE (default), INCLUDE, or EXCLUDE. The hook
 * provides functionality to toggle states and get filtered arrays based on the
 * current filter states.
 * 
 * @param {Object} [initialFilters=null] - Initial filter states
 * 
 * @returns {Object} Filter state and operations
 * @property {Object} filterMaps - Current filter states for all filter types
 * @property {Function} setFilterMaps - Function to update all filter states
 * @property {Function} getFilterState - Get the current state of a specific filter
 * @property {Function} updateFilter - Update a specific filter's state
 * @property {Function} clearFilter - Clear all filters of a specific type
 * @property {Function} getFilteredArray - Get array of items matching a filter state
 * @property {Function} toggleCategory - Toggle a category's filter state
 * @property {Function} toggleSubcategory - Toggle a subcategory's filter state
 * @property {Function} toggleTrait - Toggle a trait's filter state
 * @property {Function} clearCategorySelections - Clear all category filters
 * @property {Function} clearSubcategorySelections - Clear all subcategory filters
 * @property {Function} clearTraitSelections - Clear all trait filters
 */
export const useShopFilters = (initialFilters = null) => {
    const [filterMaps, setFilterMaps] = useState(() => 
        Object.keys(FILTER_TYPES).reduce((acc, type) => ({
            ...acc,
            [type]: initializeFilter(initialFilters?.[type])
        }), {})
    );

    const getFilterState = useCallback((filterType, key) => {
        const filterMap = filterMaps[filterType];
        if (!filterMap) return SELECTION_STATES.IGNORE;
        return filterMap.get(key) || SELECTION_STATES.IGNORE;
    }, [filterMaps]);

    const updateFilter = useCallback((filterType, key) => {
        const currentState = getFilterState(filterType, key);
        const nextState = toggleState(currentState);

        setFilterMaps(prev => ({
            ...prev,
            [filterType]: updateFilterMap(prev[filterType], key, nextState)
        }));
    }, [getFilterState]);

    const clearFilter = useCallback((filterType) => {
        setFilterMaps(prev => ({
            ...prev,
            [filterType]: new Map()
        }));
    }, []);

    const getFilteredArray = useCallback((filterType, includeState) => {
        const filterMap = filterMaps[filterType];
        if (!filterMap) return [];
        
        return Array.from(filterMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    }, [filterMaps]);

    // Create toggle callbacks
    const toggleCategory = useCallback((key) => updateFilter(FILTER_TYPES.categories, key), [updateFilter]);
    const toggleSubcategory = useCallback((key) => updateFilter(FILTER_TYPES.subcategories, key), [updateFilter]);
    const toggleTrait = useCallback((key) => updateFilter(FILTER_TYPES.traits, key), [updateFilter]);

    // Create clear callbacks
    const clearCategorySelections = useCallback(() => clearFilter(FILTER_TYPES.categories), [clearFilter]);
    const clearSubcategorySelections = useCallback(() => clearFilter(FILTER_TYPES.subcategories), [clearFilter]);
    const clearTraitSelections = useCallback(() => clearFilter(FILTER_TYPES.traits), [clearFilter]);

    return {
        filterMaps,
        setFilterMaps,
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