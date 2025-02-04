import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import itemData from '../../public/item-table.json';

const CategoryContext = createContext();

export const SELECTION_STATES = {
    IGNORE: 0,
    INCLUDE: 1,
    EXCLUDE: -1
};

export function useCategoryContext() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategoryContext must be used within a CategoryProvider');
    }
    return context;
}

function extractUniqueCategories(items) {
    const categoriesMap = new Map();

    items.forEach(item => {
        const category = item.item_category || 'Other';
        const subcategory = item.item_subcategory || 'Other';

        if (!categoriesMap.has(category)) {
            categoriesMap.set(category, new Set());
        }
        categoriesMap.get(category).add(subcategory);
    });

    // Convert to the desired format
    const result = {};
    categoriesMap.forEach((subcategories, category) => {
        result[category] = {
            subcategories: Array.from(subcategories).sort(),
            count: items.filter(item => item.item_category === category).length
        };
    });

    return result;
}

export function CategoryProvider({ children }) {
    const [categoryData, setCategoryData] = useState(() => {
        // Try to load from localStorage first
        const saved = localStorage.getItem('shop-categories');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // If not in localStorage, extract from itemData and save
        const extracted = extractUniqueCategories(itemData);
        localStorage.setItem('shop-categories', JSON.stringify(extracted));
        return extracted;
    });

    const [categoryStates, setCategoryStates] = useState(new Map());
    const [subcategoryStates, setSubcategoryStates] = useState(new Map());

    const toggleState = (currentState) => {
        if (currentState === SELECTION_STATES.IGNORE) return SELECTION_STATES.INCLUDE;
        if (currentState === SELECTION_STATES.INCLUDE) return SELECTION_STATES.EXCLUDE;
        return SELECTION_STATES.IGNORE;
    };

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

    const value = {
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
        setSubcategoryStates
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
}

CategoryProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default CategoryProvider; 