import { useState, useEffect } from 'react';
import React from 'react';

/**
 * Hook for managing tab navigation and content in the shop generator
 * 
 * Provides functionality for switching between different views (tabs) of the shop generator,
 * including inventory management, shop details, and generation settings. Handles tab state,
 * content rendering, and navigation logic.
 * 
 * @param {Object} params - The parameters for tab management
 * @param {Object} params.shopState - Current shop state
 * @param {Function} params.setShopState - Function to update shop state
 * @param {Object} params.filters - Current filter states
 * @param {Array} params.inventory - Current shop inventory
 * @param {Function} params.setInventory - Function to update inventory
 * @param {Function} params.handleSort - Function to handle inventory sorting
 * @param {Object} params.sortConfig - Current sort configuration
 * @param {boolean} params.isGenerating - Whether inventory generation is in progress
 * 
 * @returns {Object} Tab management handlers and state
 * @property {string} activeTab - Currently active tab
 * @property {Function} setActiveTab - Function to change active tab
 * @property {Object} tabContent - Content to render for current tab
 * @property {Function} handleTabChange - Handler for tab change events
 */
export const useTabManagement = (initialGroups, initialWidths) => {
    const [tabGroups, setTabGroups] = useState(initialGroups);
    const [flexBasis, setFlexBasis] = useState(initialWidths);
    const [isResizing, setIsResizing] = useState(false);

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

    // Add window-level mouse up handler for resize operations
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isResizing) {
                handleDragEnd();
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
        }, 0);
    };

    /**
     * Handles resizing tab groups
     * @param {number} newWidth - The new width of the group being resized
     * @param {number} groupIndex - Index of the group being resized
     */
    const handleResize = (newWidth, groupIndex) => {
        if (groupIndex >= tabGroups.length - 1) return;

        setIsResizing(true);
        const container = document.querySelector(".shop-generator");
        if (!container) return;

        const totalWidth = container.clientWidth;
        const minWidth = 200; // This is the minimum width of the parameters tab in pixels

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

    /**
     * Handles drag start event
     */
    const handleDragStart = (tab, tabIndex, groupIndex) => {
        setDraggedTab(tab);
        setDraggedTabIndex(tabIndex);
        setSourceGroupIndex(groupIndex);
    };

    /**
     * Handles drag end event
     */
    const handleDragEnd = () => {
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
    };

    /**
     * Updates drop indicators
     */
    const handleDropIndicatorChange = (indicators) => {
        setDropIndicators((prev) => ({ ...prev, ...indicators }));
    };

    // Initialize flex basis when tab groups change
    useEffect(() => {
        if (tabGroups.length !== flexBasis.length) {
            const defaultWidths = tabGroups.map(() => `${100 / tabGroups.length}%`);
            setFlexBasis(defaultWidths);
        }
    }, [tabGroups.length, flexBasis.length]);

    return {
        // State
        tabGroups,
        setTabGroups,
        flexBasis,
        setFlexBasis,
        isResizing,
        draggedTab,
        draggedTabIndex,
        sourceGroupIndex,
        dropIndicators,
        // Handlers
        handleTabMove,
        handleTabSplit,
        handleResize,
        handleDragStart,
        handleDragEnd,
        handleDropIndicatorChange,
    };
}; 