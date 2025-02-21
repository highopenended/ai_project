import { useState } from 'react';
import { generateShopInventory } from '../utils/generateShopInventory';
import { SELECTION_STATES } from '../utils/shopGeneratorConstants';
import { takeShopSnapshot } from '../utils/shopStateUtils';

/**
 * Hook for managing shop inventory generation
 * 
 * Handles the generation of shop inventory based on various parameters and filterMaps.
 * Includes loading state management and error handling.
 * 
 * @param {Object} params - The parameters for inventory generation
 * @param {Array} params.allItems - Master list of all available items
 * @param {Object} params.shopState - Current shop state including parameters
 * @param {Object} params.filterMaps - Current filter states for categories, subcategories, and traits
 * @param {Function} params.getFilteredArray - Function to get filtered arrays based on selection state
 * @param {Function} params.setInventory - Function to update the inventory state
 * @param {Function} params.setShopSnapshot - Function to update the shop snapshot
 * 
 * @returns {Object} Generation controls and state
 * @property {Function} generateInventory - Function to trigger inventory generation
 * @property {boolean} isGenerating - Whether generation is in progress
 */
export const useInventoryGeneration = ({
    allItems,
    shopState,
    filterMaps,
    getFilteredArray,
    setInventory,
    setShopSnapshot
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateInventory = () => {
        setIsGenerating(true);
        console.log("Generating inventory...");

        try {
            // Validate required data
            if (!allItems || allItems.length === 0) {
                console.error("No items loaded in allItems!");
                return;
            }

            console.log("Current state:", {
                currentGold: shopState.gold,
                lowestLevel: shopState.levelRange.min,
                highestLevel: shopState.levelRange.max,
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                allItemsLength: allItems.length,
                filterMaps: {
                    categories: Array.from(filterMaps.categories.entries()),
                    subcategories: Array.from(filterMaps.subcategories.entries()),
                    traits: Array.from(filterMaps.traits.entries()),
                },
            });

            const result = generateShopInventory({
                currentGold: shopState.gold,
                lowestLevel: shopState.levelRange.min,
                highestLevel: shopState.levelRange.max,
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                includedCategories: getFilteredArray("categories", SELECTION_STATES.INCLUDE),
                excludedCategories: getFilteredArray("categories", SELECTION_STATES.EXCLUDE),
                includedSubcategories: getFilteredArray("subcategories", SELECTION_STATES.INCLUDE),
                excludedSubcategories: getFilteredArray("subcategories", SELECTION_STATES.EXCLUDE),
                includedTraits: getFilteredArray("traits", SELECTION_STATES.INCLUDE),
                excludedTraits: getFilteredArray("traits", SELECTION_STATES.EXCLUDE),
                allItems,
            });

            console.log("Generation result:", result);

            if (result && Array.isArray(result.items)) {
                setInventory(result.items);
                // Take a new snapshot with the current state
                const newSnapshot = takeShopSnapshot(shopState, filterMaps, result.items);
                setShopSnapshot(newSnapshot);
                console.log("Inventory state updated with", result.items.length, "items");
            } else {
                console.error("Invalid result from generateShopInventory:", result);
            }
        } catch (error) {
            console.error("Error generating inventory:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generateInventory,
        isGenerating
    };
}; 