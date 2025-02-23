import { createContext, useContext } from 'react';

// Create the context
export const ItemDataContext = createContext(null);

// Custom hook to use the context
export function useItemData() {
    const context = useContext(ItemDataContext);
    if (!context) {
        throw new Error('useItemData must be used within an ItemDataProvider');
    }
    return context;
} 