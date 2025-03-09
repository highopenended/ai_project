import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import itemData from "../data/item-table.json";
import { extractUniqueCategories } from "../components/pages/shopgenerator/utils/filterGroupUtils";
import { ItemDataContext } from './itemData';
import { useAuth } from './AuthContext';


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
        const initId = Math.random().toString(36).substr(2, 9);

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

            
            setState({
                items: formattedData,
                categoryData: categories,
                loading: false,
                error: null
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    }, [authLoading, currentUser]);

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