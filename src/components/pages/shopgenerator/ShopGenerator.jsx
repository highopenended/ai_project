// import React, { useState } from 'react';
import { useState, useEffect } from "react";
import TabContainer from "./shared/tab/TabContainer";
import Tab_Parameters from "./tabs/Tab_Parameters";
import Tab_InventoryTable from "./tabs/Tab_InventoryTable";
import Tab_ChooseShop from "./tabs/Tab_ChooseShop";
import Tab_ShopDetails from "./tabs/Tab_ShopDetails";
import "./ShopGenerator.css";
import React from "react";
import itemData from '../../../../public/item-table.json';
import { useShopGenerator } from '../../../context/ShopGeneratorContext';
import { SELECTION_STATES } from '../../../context/shopGeneratorConstants';
import { generateShopInventory } from './utils/generateShopInventory';
import shopData from './utils/shopData';


/**
 * ShopGenerator Component
 * Parent component that manages multiple tab groups with drag and drop functionality
 *
 * State Management:
 * - tabGroups: 2D array where each inner array represents a group of tabs
 * - draggedTab: Currently dragged tab component
 * - draggedTabIndex: Index of dragged tab in its group
 * - sourceGroupIndex: Index of the group where drag started
 * - dropIndicators: Visual indicators for group splitting
 *
 * Key Behaviors:
 * 1. Tab Movement:
 *    - Within same group: Reorders tabs
 *    - Between groups: Moves tab to new group
 *    - To edges: Creates new groups
 *
 * 2. State Updates:
 *    - Uses setTimeout to ensure clean state transitions
 *    - Resets drag states before updating groups
 *    - Maintains group integrity during operations
 *
 * Common Issues & Solutions:
 * 1. Double drag required: Check state reset timing
 * 2. Groups not updating: Verify setTimeout execution
 * 3. Tab duplication: Check key generation
 * 4. State sync issues: Verify parent-child prop flow
 */

const STORAGE_KEY = "tabGroupsState";

function ShopGenerator() {
    // Core state management
    const [items, setItems] = useState([]); // Current shop inventory
    const [allItems, setAllItems] = useState([]); // Master list of all possible items
    const [loading, setLoading] = useState(true);
    const [currentGold, setCurrentGold] = useState(0);
    const [lowestLevel, setLowestLevel] = useState(0);
    const [highestLevel, setHighestLevel] = useState(10);
    const [sortConfig, setSortConfig] = useState([]);
    const [itemBias, setItemBias] = useState({ x: 0.5, y: 0.5 }); // Default to center
    const [hasInitialSort, setHasInitialSort] = useState(false);
    const [rarityDistribution, setRarityDistribution] = useState({
        Common: 95.00,
        Uncommon: 4.50,
        Rare: 0.49,
        Unique: 0.01
    });

    // Shop state management
    // currentShop contains all metadata and parameters for the current shop
    // savedShops maintains the list of all shops for the current user
    const [currentShop, setCurrentShop] = useState(shopData);
    const [savedShops, setSavedShops] = useState([]);
    // Get filter states from context
    const {
        categoryStates,
        subcategoryStates,
        traitStates,
    } = useShopGenerator();

    // Initial data loading
    useEffect(() => {
        try {
            // Format and process the imported data
            console.log('Loading items from itemData...');
            console.log('Raw itemData length:', itemData.length);
            
            const formattedData = itemData.map(item => ({
                ...item,
                bulk: item.bulk?.trim() === '' ? '-' : item.bulk,
                level: item.level ? item.level : '0'
            }));
            
            console.log('Formatted data length:', formattedData.length);
            setAllItems(formattedData);
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }, []);

    // Function to get filtered arrays from Maps
    const getFilteredArray = (stateMap, includeState) => {
        return Array.from(stateMap.entries())
            .filter(([, state]) => state === includeState)
            .map(([item]) => item);
    };

    // Shop generation
    const handleGenerateClick = () => {
        console.log('handleGenerateClick called');
        
        // Validate required data
        if (!allItems || allItems.length === 0) {
            console.error('No items loaded in allItems!');
            return;
        }

        if (!categoryStates || !subcategoryStates || !traitStates) {
            console.error('Filter states not initialized!', {
                categoryStates: !!categoryStates,
                subcategoryStates: !!subcategoryStates,
                traitStates: !!traitStates
            });
            return;
        }

        console.log('Current state:', {
            currentGold,
            lowestLevel,
            highestLevel,
            itemBias,
            rarityDistribution,
            allItemsLength: allItems.length
        });

        // Convert Maps to arrays of included/excluded items
        const includedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);
            
        const excludedCategories = Array.from(categoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);
            
        const includedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);
            
        const excludedSubcategories = Array.from(subcategoryStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);
            
        const includedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.INCLUDE)
            .map(([item]) => item);
            
        const excludedTraits = Array.from(traitStates.entries())
            .filter(([, state]) => state === SELECTION_STATES.EXCLUDE)
            .map(([item]) => item);

        console.log('Filter states:', {
            categoryStates: Array.from(categoryStates.entries()),
            subcategoryStates: Array.from(subcategoryStates.entries()),
            traitStates: Array.from(traitStates.entries())
        });

        console.log('Processed filters:', {
            includedCategories,
            excludedCategories,
            includedSubcategories,
            excludedSubcategories,
            includedTraits,
            excludedTraits
        });

        const result = generateShopInventory({
            currentGold,
            lowestLevel,
            highestLevel,
            itemBias,
            rarityDistribution,
            includedCategories,
            excludedCategories,
            includedSubcategories,
            excludedSubcategories,
            includedTraits,
            excludedTraits,
            allItems
        });

        console.log('Generation result:', result);
        
        if (result && Array.isArray(result.items)) {
            setItems(result.items);
            console.log('Items state updated with', result.items.length, 'items');
        } else {
            console.error('Invalid result from generateShopInventory:', result);
        }
    };

    // Load initial state from localStorage or use default
    const loadInitialState = () => {
        // localStorage.clear(STORAGE_KEY);

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const { groups, widths } = JSON.parse(savedState);
            // Recreate tab components from saved data
            const recreatedGroups = groups.map((group) =>
                group.map((tab) => {
                    // Create component with appropriate props based on type
                    switch (tab.type) {
                        case 'Tab_Parameters':
                            return (
                                <Tab_Parameters
                                    key={tab.key}
                                    type={{ name: 'Tab_Parameters' }}
                                    handleGenerateClick={handleGenerateClick}
                                    currentGold={currentGold}
                                    setCurrentGold={setCurrentGold}
                                    lowestLevel={lowestLevel}
                                    setLowestLevel={setLowestLevel}
                                    highestLevel={highestLevel}
                                    setHighestLevel={setHighestLevel}
                                    rarityDistribution={rarityDistribution}
                                    setRarityDistribution={setRarityDistribution}
                                    itemBias={itemBias}
                                    setItemBias={setItemBias}
                                />
                            );
                        case 'Tab_InventoryTable':
                            return (
                                <Tab_InventoryTable 
                                    key={tab.key}
                                    type={{ name: 'Tab_InventoryTable' }}
                                    items={items}
                                    currentShop={currentShop.shortData.shopName}
                                />
                            );
                        case 'Tab_ChooseShop':
                            return <Tab_ChooseShop key={tab.key} type={{ name: 'Tab_ChooseShop' }} />;
                        case 'Tab_ShopDetails':
                            return <Tab_ShopDetails key={tab.key} type={{ name: 'Tab_ShopDetails' }} />;
                        default:
                            console.warn(`Unknown tab type: ${tab.type}`);
                            return null;
                    }
                }).filter(Boolean) // Remove any null components
            );
            return { groups: recreatedGroups, widths };
        }

        // Default state if nothing is saved
        return {
            groups: [
                [
                    <Tab_Parameters
                        key="Tab_Parameters-0"
                        type={{ name: 'Tab_Parameters' }}
                        handleGenerateClick={handleGenerateClick}
                        currentGold={currentGold}
                        setCurrentGold={setCurrentGold}
                        lowestLevel={lowestLevel}
                        setLowestLevel={setLowestLevel}
                        highestLevel={highestLevel}
                        setHighestLevel={setHighestLevel}
                        rarityDistribution={rarityDistribution}
                        setRarityDistribution={setRarityDistribution}
                        itemBias={itemBias}
                        setItemBias={setItemBias}
                    />,
                    <Tab_InventoryTable 
                        key="Tab_InventoryTable-0"
                        type={{ name: 'Tab_InventoryTable' }}
                        items={items}
                        currentShop={currentShop.shortData.shopName}
                    />,
                    <Tab_ChooseShop key="Tab_ChooseShop-0" type={{ name: 'Tab_ChooseShop' }} />,
                    <Tab_ShopDetails key="Tab_ShopDetails-0" type={{ name: 'Tab_ShopDetails' }} />,
                ],
            ],
            widths: ["100%"],
        };
    };

    const initialState = loadInitialState();
    const [tabGroups, setTabGroups] = useState(initialState.groups);
    const [flexBasis, setFlexBasis] = useState(initialState.widths);

    // State for drag and drop operations
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [sourceGroupIndex, setSourceGroupIndex] = useState(null);
    const [dropIndicators, setDropIndicators] = useState({
        leftGroup: null,
        rightGroup: null,
        betweenGroups: null,
        betweenGroupsRight: null,
    });
    const [isResizing, setIsResizing] = useState(false);

    // Save state whenever tab groups or widths change
    useEffect(() => {
        const saveState = () => {
            const groupsData = tabGroups.map((group) =>
                group.map((tab) => ({
                    type: tab.type.name,
                    key: tab.key,
                }))
            );

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    groups: groupsData,
                    widths: flexBasis,
                })
            );
        };

        saveState();
    }, [tabGroups, flexBasis]);

    // Remove the automatic flex basis initialization since we're loading from storage
    useEffect(() => {
        if (tabGroups.length !== flexBasis.length) {
            const defaultWidths = tabGroups.map(() => `${100 / tabGroups.length}%`);
            setFlexBasis(defaultWidths);

            // Save the new widths
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    groups: tabGroups.map((group) =>
                        group.map((tab) => ({
                            type: tab.type.name,
                            key: tab.key,
                        }))
                    ),
                    widths: defaultWidths,
                })
            );
        }
    }, [tabGroups.length]);

    
    // Add window-level mouse up handler
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
            }
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);

        // Cleanup
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [isResizing]);

    /**
     * Handles moving tabs within and between groups
     * @param {Array|Array[]} newTabs - Either the reordered tabs or [sourceTab, dropIndex]
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {number} [targetGroupIndex] - Index of the target group (if moving between groups)
     */
    const handleTabMove = (newTabs, sourceGroupIndex, targetGroupIndex) => {
        // First reset all drag states to ensure clean state for next operation
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setSourceGroupIndex(null);
        setDropIndicators({
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null,
            betweenGroupsRight: null,
        });

        // Then update the groups after a short delay to ensure state is clean
        setTimeout(() => {
            setTabGroups((prevGroups) => {
                const newGroups = [...prevGroups];

                if (targetGroupIndex !== undefined) {
                    const [sourceTab, dropIndex] = newTabs;
                    const sourceGroup = [...prevGroups[sourceGroupIndex]];

                    // Find and remove the source tab
                    const sourceTabIndex = sourceGroup.findIndex(
                        (tab) => tab.type.name === sourceTab.type.name && (!tab.key || tab.key === sourceTab.key)
                    );
                    if (sourceTabIndex !== -1) {
                        sourceGroup.splice(sourceTabIndex, 1);
                    }

                    if (sourceGroup.length === 0) {
                        newGroups.splice(sourceGroupIndex, 1);
                        if (targetGroupIndex > sourceGroupIndex) {
                            targetGroupIndex--;
                        }
                    } else {
                        newGroups[sourceGroupIndex] = sourceGroup;
                    }

                    // When moving back to original group, don't create a new tab
                    const targetGroup = [...(newGroups[targetGroupIndex] || [])];
                    const isMovingBackToOriginal = sourceGroupIndex === targetGroupIndex;

                    if (isMovingBackToOriginal) {
                        targetGroup.splice(dropIndex, 0, sourceTab);
                    } else {
                        const newTab = React.cloneElement(sourceTab, {
                            key: `${sourceTab.type.name}-${Date.now()}`,
                        });
                        targetGroup.splice(dropIndex, 0, newTab);
                    }

                    newGroups[targetGroupIndex] = targetGroup;
                } else {
                    newGroups[sourceGroupIndex] = newTabs;
                }

                return newGroups;
            });
        }, 0);
    };

    /**
     * Handles creating new groups by splitting existing ones
     * @param {Object} tabInfo - Information about the tab being split
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {boolean|number} targetPosition - Where to create the new group
     */
    const handleTabSplit = (tabInfo, sourceGroupIndex, targetPosition) => {
        setTabGroups((prevGroups) => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];

            const sourceTab = sourceGroup.find((tab) => tab.type.name === tabInfo.type);

            if (!sourceTab) {
                return prevGroups;
            }

            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);

            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`,
            });

            const newGroup = [newTab];

            if (sourceGroup.length === 0) {
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === "number" && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            // Handle numeric target position (between groups)
            if (typeof targetPosition === "number") {
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                newGroups.push(newGroup);
            } else {
                newGroups.unshift(newGroup);
            }

            return newGroups;
        });
    };

    const handleResize = (newWidth, groupIndex) => {
        if (groupIndex >= tabGroups.length - 1) return;

        setIsResizing(true);
        const container = document.querySelector(".new-test");
        if (!container) return;

        const totalWidth = container.clientWidth;
        const minWidth = 200; // Minimum width in pixels

        setFlexBasis((prev) => {
            const newBasis = [...prev];

            // Calculate the new width percentage
            let currentPercent = (newWidth / totalWidth) * 100;

            // Ensure minimum width
            if (currentPercent < (minWidth / totalWidth) * 100) {
                currentPercent = (minWidth / totalWidth) * 100;
            }

            // Calculate remaining width for next group
            const remainingPercent = parseFloat(newBasis[groupIndex]) + parseFloat(newBasis[groupIndex + 1]);
            const nextGroupPercent = remainingPercent - currentPercent;

            // Ensure next group also maintains minimum width
            if (nextGroupPercent < (minWidth / totalWidth) * 100) {
                return prev;
            }

            newBasis[groupIndex] = `${currentPercent}%`;
            newBasis[groupIndex + 1] = `${nextGroupPercent}%`;

            return newBasis;
        });
    };

    return (
        <div className={`new-test ${isResizing ? "resizing" : ""}`}>
            {tabGroups.map((tabs, index) => (
                <TabContainer
                    key={index}
                    groupIndex={index}
                    tabs={tabs}
                    draggedTab={draggedTab}
                    draggedTabIndex={draggedTabIndex}
                    sourceGroupIndex={sourceGroupIndex}
                    dropIndicators={dropIndicators}
                    isLastGroup={index === tabGroups.length - 1}
                    onResize={handleResize}
                    style={{ width: flexBasis[index] || `${100 / tabGroups.length}%` }}
                    onDragStart={(tab, tabIndex) => {
                        setDraggedTab(tab);
                        setDraggedTabIndex(tabIndex);
                        setSourceGroupIndex(index);
                    }}
                    onDragEnd={() => {
                        setDraggedTab(null);
                        setDraggedTabIndex(null);
                        setSourceGroupIndex(null);
                        setIsResizing(false);
                        setDropIndicators({
                            leftGroup: null,
                            rightGroup: null,
                            betweenGroups: null,
                            betweenGroupsRight: null,
                        });
                    }}
                    onDropIndicatorChange={(indicators) => {
                        setDropIndicators((prev) => ({ ...prev, ...indicators }));
                    }}
                    onTabMove={(newTabs) => {
                        if (Array.isArray(newTabs) && newTabs.length === 2 && typeof newTabs[1] === "number") {
                            handleTabMove(newTabs, sourceGroupIndex, index);
                        } else {
                            handleTabMove(newTabs, index);
                        }
                    }}
                    onTabClick={() => {}}
                    onTabSplit={handleTabSplit}
                />
            ))}
        </div>
    );
}

export default ShopGenerator;
