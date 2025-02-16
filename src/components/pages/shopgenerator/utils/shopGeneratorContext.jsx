import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import itemData from '../../../../../public/item-table.json';
import { SELECTION_STATES } from './shopGeneratorConstants';

const ShopGeneratorContext = createContext();

function extractUniqueCategories(items) {
    const categoriesMap = new Map();
    const subcategoryCounts = new Map();

    items.forEach(item => {
        const category = item.item_category || 'Other';
        const subcategory = item.item_subcategory || 'Other';

        // Track category-subcategory relationships
        if (!categoriesMap.has(category)) {
            categoriesMap.set(category, new Set());
        }
        categoriesMap.get(category).add(subcategory);

        // Track subcategory counts
        subcategoryCounts.set(subcategory, (subcategoryCounts.get(subcategory) || 0) + 1);
    });

    const result = {
        categories: {},
        subcategoryCounts: Object.fromEntries(subcategoryCounts)
    };

    categoriesMap.forEach((subcategories, category) => {
        result.categories[category] = {
            subcategories: Array.from(subcategories).sort(),
            count: items.filter(item => item.item_category === category).length
        };
    });

    return result;
}

export function ShopGeneratorProvider({ children }) {
    // Category state
    const [categoryData] = useState(() => {
        const saved = localStorage.getItem('shop-categories');
        if (saved) {
            return JSON.parse(saved);
        }
        
        const extracted = extractUniqueCategories(itemData);
        localStorage.setItem('shop-categories', JSON.stringify(extracted));
        return extracted;
    });

    const [categoryStates, setCategoryStates] = useState(new Map());
    const [subcategoryStates, setSubcategoryStates] = useState(new Map());

    // Trait state
    const [traitStates, setTraitStates] = useState(new Map());

    // Shared toggle function for both categories and traits
    const toggleState = (currentState) => {
        if (currentState === SELECTION_STATES.IGNORE) return SELECTION_STATES.INCLUDE;
        if (currentState === SELECTION_STATES.INCLUDE) return SELECTION_STATES.EXCLUDE;
        return SELECTION_STATES.IGNORE;
    };

    // Category functions
    const toggleCategory = (category) => {
        setCategoryStates(prev => {
            const newMap = new Map(prev);
            const currentState = prev.get(category) || SELECTION_STATES.IGNORE;
            const nextState = toggleState(currentState);
            
            if (nextState === SELECTION_STATES.IGNORE) {
                newMap.delete(category);
            } else {
                newMap.set(category, nextState);
            }
            return newMap;
        });
    };

    const toggleSubcategory = (subcategory) => {
        setSubcategoryStates(prev => {
            const newMap = new Map(prev);
            const currentState = prev.get(subcategory) || SELECTION_STATES.IGNORE;
            const nextState = toggleState(currentState);
            
            if (nextState === SELECTION_STATES.IGNORE) {
                newMap.delete(subcategory);
            } else {
                newMap.set(subcategory, nextState);
            }
            return newMap;
        });
    };

    const clearCategorySelections = () => {
        setCategoryStates(new Map());
    };

    const clearSubcategorySelections = () => {
        setSubcategoryStates(new Map());
    };

    const getCategoryState = (category) => {
        return categoryStates.get(category) || SELECTION_STATES.IGNORE;
    };

    const getSubcategoryState = (subcategory) => {
        return subcategoryStates.get(subcategory) || SELECTION_STATES.IGNORE;
    };

    // Trait functions
    const toggleTrait = (trait) => {
        setTraitStates(prev => {
            const newMap = new Map(prev);
            const currentState = prev.get(trait) || SELECTION_STATES.IGNORE;
            const nextState = toggleState(currentState);
            
            if (nextState === SELECTION_STATES.IGNORE) {
                newMap.delete(trait);
            } else {
                newMap.set(trait, nextState);
            }
            return newMap;
        });
    };

    const clearTraitSelections = () => {
        setTraitStates(new Map());
    };

    const getTraitState = (trait) => {
        return traitStates.get(trait) || SELECTION_STATES.IGNORE;
    };

    const value = {
        // Category-related
        categoryData,
        categoryStates,
        subcategoryStates,
        getCategoryState,
        getSubcategoryState,
        toggleCategory,
        toggleSubcategory,
        clearCategorySelections,
        clearSubcategorySelections,
        setCategoryStates,
        setSubcategoryStates,

        // Trait-related
        traitStates,
        getTraitState,
        toggleTrait,
        clearTraitSelections,
        setTraitStates,
    };

    return (
        <ShopGeneratorContext.Provider value={value}>
            {children}
        </ShopGeneratorContext.Provider>
    );
}

ShopGeneratorProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useShopGenerator() {
    const context = useContext(ShopGeneratorContext);
    if (!context) {
        throw new Error('useShopGenerator must be used within a ShopGeneratorProvider');
    }
    return context;
}

export default ShopGeneratorProvider; 