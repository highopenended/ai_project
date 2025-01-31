import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import itemData from '../../public/item-table.json';

const CategoryContext = createContext();

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

    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedSubcategories, setSelectedSubcategories] = useState(new Set());

    // Provide methods to modify selections
    const toggleCategory = (category) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const toggleSubcategory = (subcategory) => {
        setSelectedSubcategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subcategory)) {
                newSet.delete(subcategory);
            } else {
                newSet.add(subcategory);
            }
            return newSet;
        });
    };

    const clearCategorySelections = () => {
        setSelectedCategories(new Set());
    };

    const clearSubcategorySelections = () => {
        setSelectedSubcategories(new Set());
    };

    const value = {
        categoryData,
        selectedCategories,
        selectedSubcategories,
        toggleCategory,
        toggleSubcategory,
        clearCategorySelections,
        clearSubcategorySelections
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