import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import itemData from "../data/item-table.json";
import { extractUniqueCategories } from "../components/pages/shopgenerator/utils/categoryUtils";
import { ItemDataContext } from './itemData';

export function ItemDataProvider({ children }) {
    const [state, setState] = useState({
        items: [],
        categoryData: null,
        loading: true,
        error: null
    });

    // Load items on mount
    useEffect(() => {
        try {
            console.log("Loading items from itemData...");
            console.log("Raw itemData length:", itemData.length);

            if (!itemData || !Array.isArray(itemData)) {
                throw new Error(`Invalid item data format: ${typeof itemData}`);
            }

            // Format and process the imported data
            const formattedData = itemData.map((item) => ({
                ...item,
                bulk: item.bulk?.trim() === "" ? "-" : item.bulk,
                level: item.level ? item.level : "0",
            }));

            // Extract categories
            const categories = extractUniqueCategories(itemData);

            console.log("Formatted data length:", formattedData.length);
            
            setState({
                items: formattedData,
                categoryData: categories,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error("Error loading items:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    }, []);

    return (
        <ItemDataContext.Provider value={state}>
            {children}
        </ItemDataContext.Provider>
    );
}

ItemDataProvider.propTypes = {
    children: PropTypes.node.isRequired
}; 