import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import itemData from '../../../../../public/item-table.json';
import { extractUniqueCategories } from './categoryUtils';

const ShopGeneratorContext = createContext();

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

    const value = {
        categoryData
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