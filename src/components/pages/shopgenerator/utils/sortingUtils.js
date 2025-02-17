import { useState, useEffect, useCallback } from 'react';
import { RARITY_ORDER } from "../../../../constants/rarityOrder";

export const getNextSortDirection = (currentDirection, columnName) => {
    if (columnName === "rarity") {
        switch (currentDirection) {
            case undefined: return "asc";
            case "asc": return "desc";
            case "desc": return undefined;
            default: return undefined;
        }
    }

    if (columnName === "name" || columnName === "item_category" || columnName === "item_subcategory") {
        switch (currentDirection) {
            case undefined: return "asc";
            case "asc": return "desc";
            case "desc": return undefined;
            default: return undefined;
        }
    }

    switch (currentDirection) {
        case undefined: return "desc";
        case "desc": return "asc";
        case "asc": return undefined;
        default: return undefined;
    }
};

export const sortItems = (items, sortConfig) => {
    if (!sortConfig.length) return items;

    return [...items].sort((a, b) => {
        for (const { column, direction } of sortConfig) {
            let comparison = 0;
            let aPrice, bPrice, aIndex, bIndex;

            switch (column) {
                case "count":
                    comparison = a.count - b.count;
                    break;
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "level":
                    comparison = parseInt(a.level) - parseInt(b.level);
                    break;
                case "price":
                    aPrice = parseFloat(a.price.replace(/[^0-9.-]+/g, ""));
                    bPrice = parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
                    comparison = aPrice - bPrice;
                    break;
                case "total":
                    comparison = a.total - b.total;
                    break;
                case "item_category":
                    comparison = (a.item_category || "").localeCompare(b.item_subcategory || "");
                    break;
                case "item_subcategory":
                    comparison = (a.item_subcategory || "").localeCompare(b.item_subcategory || "");
                    break;
                case "rarity":
                    aIndex = RARITY_ORDER.indexOf(a.rarity);
                    bIndex = RARITY_ORDER.indexOf(b.rarity);
                    comparison = aIndex - bIndex;
                    break;
                default:
                    comparison = 0;
            }

            if (comparison !== 0) {
                if (column === "name" || column === "item_category" || 
                    column === "item_subcategory" || column === "rarity") {
                    return direction === "asc" ? comparison : -comparison;
                }
                return direction === "asc" ? comparison : -comparison;
            }
        }
        return 0;
    });
};

export const useSorting = (initialItems = []) => {
    const [sortConfig, setSortConfig] = useState([]);
    const [sortedItems, setSortedItems] = useState(initialItems);

    const handleSort = useCallback((columnName) => {
        setSortConfig(prevConfig => {
            const newConfig = prevConfig.filter(sort => sort.column !== columnName);
            const currentDirection = prevConfig.find(sort => sort.column === columnName)?.direction;
            const nextDirection = getNextSortDirection(currentDirection, columnName);
            
            if (nextDirection) {
                newConfig.push({ column: columnName, direction: nextDirection });
            }
            return newConfig;
        });
    }, []);

    useEffect(() => {
        const newSortedItems = sortItems(initialItems, sortConfig);
        setSortedItems(newSortedItems);
    }, [sortConfig, initialItems]);

    return {
        sortedItems,
        sortConfig,
        handleSort
    };
}; 