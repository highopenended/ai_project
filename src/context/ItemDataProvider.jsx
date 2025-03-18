import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import legacyItemData from "../data/item-table.json";
import fvttItemData from "../data/fvtt-Item-pack-pf2e-equipment-srd.json";
import { extractUniqueCategories } from "../components/pages/shopgenerator/utils/filterGroupUtils";
import { ItemDataContext } from './itemData';
import { useAuth } from './AuthContext';

/**
 * Creates a map to quickly lookup items from item-table.json by name
 * @param {Array} items - Array of items from item-table.json
 * @returns {Map} Map of items by name for quick lookup
 */
const createItemNameMap = (items) => {
    const map = new Map();
    items.forEach(item => {
        map.set(item.name.toLowerCase(), item);
    });
    return map;
};

/**
 * Formats a price object from the FVTT format to the legacy string format
 * @param {Object} priceObj - FVTT price object (e.g., {gp: 5, sp: 2})
 * @returns {string} Formatted price string (e.g., "5 gp 2 sp")
 */
const formatPrice = (priceObj) => {
    if (!priceObj || !priceObj.value) return "";
    
    const currencies = Object.entries(priceObj.value)
        .filter(entry => entry[1] > 0) // Filter by amount which is the second element
        .map(([currency, amount]) => `${amount} ${currency}`);
    
    return currencies.join(" ");
};

export function ItemDataProvider({ children }) {
    const { currentUser, loading: authLoading } = useAuth();
    const initRef = useRef(false);
    const [state, setState] = useState({
        items: [],
        categoryData: null,
        loading: true,
        error: null
    });

    // Load items after auth is ready
    useEffect(() => {
        // Don't load items until auth is ready
        if (authLoading) {
            return;
        }

        // Skip if already initialized
        if (initRef.current) {
            return;
        }

        // Set initialization flag immediately
        initRef.current = true;

        try {
            // Validate legacy item data
            if (!legacyItemData || !Array.isArray(legacyItemData)) {
                throw new Error(`Invalid legacy item data format: ${typeof legacyItemData}`);
            }

            // Validate FVTT item data
            if (!fvttItemData || !fvttItemData.items || !Array.isArray(fvttItemData.items)) {
                throw new Error(`Invalid FVTT item data format: ${typeof fvttItemData}`);
            }

            // Create a map for legacy items by name for quick lookup
            const legacyItemMap = createItemNameMap(legacyItemData);
            
            // Process FVTT items and merge with legacy categories
            const mergedItems = fvttItemData.items.map(fvttItem => {
                // Look up the legacy item by name
                const legacyItem = legacyItemMap.get(fvttItem.name.toLowerCase());
                
                // Create a base item using FVTT data
                const baseItem = {
                    // Use the FVTT properties, but format them appropriately
                    name: fvttItem.name,
                    rarity: fvttItem.system?.traits?.rarity?.charAt(0).toUpperCase() + fvttItem.system?.traits?.rarity?.slice(1) || "Common",
                    trait: Array.isArray(fvttItem.system?.traits?.value) ? fvttItem.system.traits.value.join(", ") : "",
                    level: fvttItem.system?.level?.value?.toString() || "0",
                    price: formatPrice(fvttItem.system?.price) || "",
                    bulk: fvttItem.system?.bulk?.value?.toString() || "",
                    
                    // Default category/subcategory when no match is found
                    item_category: "Other",
                    item_subcategory: "Other",
                    
                    // Additional properties from FVTT data that might be useful
                    type: fvttItem.type,
                    category: fvttItem.system?.category || "",
                    group: fvttItem.system?.group || "",
                    
                    // We'll add a flag to indicate this is from FVTT data
                    source_fvtt: true
                };
                
                // If we found a matching legacy item, use its categorical data
                if (legacyItem) {
                    baseItem.item_category = legacyItem.item_category;
                    baseItem.item_subcategory = legacyItem.item_subcategory;
                    baseItem.pfs = legacyItem.pfs || "";
                    baseItem.source = legacyItem.source || "";
                    baseItem.usage = legacyItem.usage || "";
                    baseItem.spoilers = legacyItem.spoilers || "";
                    baseItem.url = legacyItem.url || "";
                } else {
                    // No match found - try to infer a reasonable category from FVTT data
                    baseItem.item_category = mapFvttTypeToCategory(fvttItem);
                    baseItem.item_subcategory = mapFvttCategoryToSubcategory(fvttItem);
                    baseItem.pfs = "Standard"; // Default value
                    baseItem.source = fvttItem.system?.publication?.title || "";
                    baseItem.usage = "";
                    baseItem.spoilers = "";
                    baseItem.url = "";
                }
                
                return baseItem;
            });
            
            // Process the data as before
            const formattedData = mergedItems.map((item) => ({
                ...item,
                bulk: item.bulk?.trim() === "" ? "-" : item.bulk,
                level: item.level ? item.level : "0",
            }));

            // Extract categories using the legacy utility
            const categories = extractUniqueCategories(formattedData);
            
            setState({
                items: formattedData,
                categoryData: categories,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error("Error loading item data:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    }, [authLoading, currentUser]);

    // Helper function to map FVTT type to a category
    function mapFvttTypeToCategory(fvttItem) {
        switch(fvttItem.type) {
            case 'weapon':
                return 'Weapons';
            case 'armor':
                return 'Armor';
            case 'equipment':
                return 'Adventuring Gear';
            case 'consumable':
                if (fvttItem.system?.category === 'potion') return 'Potions';
                if (fvttItem.system?.category === 'scroll') return 'Scrolls';
                if (fvttItem.system?.category === 'wand') return 'Wands';
                return 'Alchemical Items';
            case 'backpack':
                return 'Adventuring Gear';
            case 'treasure':
                return 'Trade Goods';
            case 'shield':
                return 'Armor';
            default:
                return 'Other';
        }
    }

    // Helper function to map FVTT category to a subcategory
    function mapFvttCategoryToSubcategory(fvttItem) {
        // For weapons, map based on category and group
        if (fvttItem.type === 'weapon') {
            if (fvttItem.system?.category === 'simple') return 'Simple Weapons';
            if (fvttItem.system?.category === 'martial') return 'Martial Weapons';
            if (fvttItem.system?.category === 'advanced') return 'Advanced Weapons';
            return 'Base Weapons';
        }
        
        // For armor, map based on category
        if (fvttItem.type === 'armor') {
            if (fvttItem.system?.category === 'light') return 'Light Armor';
            if (fvttItem.system?.category === 'medium') return 'Medium Armor';
            if (fvttItem.system?.category === 'heavy') return 'Heavy Armor';
            return 'Armor';
        }
        
        // For consumables, map based on category
        if (fvttItem.type === 'consumable') {
            return fvttItem.system?.category || 'Other';
        }
        
        return 'Other';
    }

    // Debug overlay style
    const debugStyle = {
        position: 'fixed',
        bottom: '80px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px'
    };

    if (authLoading) {
        return (
            <div style={debugStyle}>
                <div>⏳ Waiting for auth...</div>
            </div>
        );
    }

    if (state.loading && !state.error) {
        return (
            <div style={debugStyle}>
                <div>🔄 Loading items...</div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div style={debugStyle}>
                <div>❌ Error loading items: {state.error}</div>
            </div>
        );
    }

    return (
        <>
            <ItemDataContext.Provider value={state}>
                {children}
            </ItemDataContext.Provider>
            {/* <div style={debugStyle}>
                <div>✓ Items loaded: {state.items.length}</div>
                <div>Categories: {state.categoryData ? Object.keys(state.categoryData).length : 0}</div>
            </div> */}
        </>
    );
}

ItemDataProvider.propTypes = {
    children: PropTypes.node.isRequired
}; 