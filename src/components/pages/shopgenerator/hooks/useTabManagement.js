import { useState, useCallback, useEffect } from "react";
import { debug } from '../../../../utils/debugUtils';
import useTabResize from './useTabResize';
import useTabDropIndicators from './useTabDropIndicators';

/**
 * Tab Management System Documentation
 *
 * Architecture Overview:
 * The tab management system is built on three core principles:
 * 1. Separation of Layout and State: Tab structure/positioning is independent of component state
 * 2. Reference Preservation: Component references and state are maintained during all operations
 * 3. Memoized Updates: Changes to one tab don't trigger re-renders of other tabs
 *
 * Key Concepts:
 * - Tab Structure: The physical arrangement of tabs in groups
 * - Tab Registry: Memoized storage of tab props and state
 * - Component References: Original React components for each tab
 *
 * Data Flow:
 * 1. Tab Structure Changes (move/split) -> Update Layout
 * 2. Tab State Changes -> Update Registry -> Propagate to Specific Tab
 * 3. Tab Props -> Memoized by Registry -> Passed to Components
 *
 * @typedef {Object} Tab
 * @property {string} key - Unique identifier for the tab
 * @property {Object} type - Tab type information
 * @property {string} type.name - Identifier matching TAB_TYPE_IDENTIFIERS
 * @property {React.ComponentType} type.component - The actual React component
 * @property {number} type.minWidth - Minimum width in pixels
 *
 * @typedef {Object} DragState
 * @property {boolean} isResizing - Whether a resize operation is in progress
 * @property {Tab|null} draggedTab - Currently dragged tab
 * @property {number|null} draggedTabIndex - Index of dragged tab
 * @property {number|null} sourceGroupIndex - Group index of drag source
 * @property {Object} dropIndicators - Visual indicators for drag operations
 */

/**
 * Hook for managing tab navigation, layout, and content in the shop generator
 *
 * Provides functionality for switching between different views (tabs) of the shop generator,
 * including inventory management, shop details, and generation settings. Handles tab state,
 * content rendering, and navigation logic.
 *
 * @param {Object} params - The parameters for tab management
 * @param {Array<Array<Tab>>} params.initialTabGroups - Initial tab groups configuration
 * @param {Array<string>} params.initialGroupWidths - Initial widths for tab groups
 *
 * @returns {Object} Tab management handlers and state
 * @property {Array<Array<Tab>>} tabGroups - Current tab groups configuration
 * @property {Function} setTabGroups - Function to update tab groups
 * @property {Array<string>} flexBasis - Current widths for tab groups
 * @property {Function} setFlexBasis - Function to update group widths
 * @property {boolean} isResizing - Whether a resize operation is in progress
 * @property {Tab|null} draggedTab - Currently dragged tab
 * @property {number|null} draggedTabIndex - Index of dragged tab
 * @property {number|null} sourceGroupIndex - Group index of drag source
 * @property {Object} dropIndicators - Visual indicators for drag operations
 * @property {Function} handleTabMove - Handler for tab movement
 * @property {Function} handleTabSplit - Handler for tab splitting
 * @property {Function} handleResize - Handler for group resizing
 * @property {Function} handleDragStart - Handler for drag start
 * @property {Function} handleDragEnd - Handler for drag end
 * @property {Function} handleDropIndicatorChange - Handler for drop indicator changes
 */
export const useTabManagement = ({ initialTabGroups, initialGroupWidths }) => {
    // Consolidated state management
    const [tabGroups, setTabGroups] = useState(initialTabGroups);
    const [dragState, setDragState] = useState({
        draggedTab: null,
        draggedTabIndex: null,
        sourceGroupIndex: null
    });
    
    // Track active tabs for each group
    const [activeTabTypes, setActiveTabTypes] = useState({});

    // Initialize active tab types when component mounts or tab groups change
    useEffect(() => {
        const initialActiveTypes = {};
        tabGroups.forEach((group, index) => {
            if (group.length > 0 && !activeTabTypes[index]) {
                initialActiveTypes[index] = group[0].type.name;
            }
        });
        
        if (Object.keys(initialActiveTypes).length > 0) {
            debug("tabManagement", "Initializing active tab types", initialActiveTypes);
            setActiveTabTypes(prev => ({
                ...prev,
                ...initialActiveTypes
            }));
        }
    }, [tabGroups, activeTabTypes]);

    // Use the tab resize hook with active tab information
    const {
        flexBasis,
        setFlexBasis,
        isResizing,
        handleResize,
        handleResizeEnd
    } = useTabResize({
        initialGroupWidths,
        tabGroupsLength: tabGroups.length,
        tabGroups,
        activeTabTypes
    });

    // Use the tab drop indicators hook
    const {
        indicators: dropIndicators,
        showIndicators,
        hideIndicators,
        determineDropAction
    } = useTabDropIndicators();

    /**
     * Updates drag state with batched changes
     * @param {Object} updates - State updates to apply
     */
    const handleDragStateUpdate = useCallback((updates) => {
        setDragState(prev => ({ ...prev, ...updates }));
        debug("tabManagement", "Updating drag state", updates);
    }, []);

    /**
     * Resets all drag state properties
     */
    const handleDragStateReset = useCallback(() => {
        handleDragStateUpdate({
            draggedTab: null,
            draggedTabIndex: null,
            sourceGroupIndex: null
        });
        hideIndicators();
    }, [handleDragStateUpdate, hideIndicators]);

    /**
     * Resets all drag and drop state
     */
    const handleDragEnd = useCallback(() => {
        debug("tabManagement", "Ending drag/resize operation");
        handleDragStateReset();
        handleResizeEnd();
    }, [handleDragStateReset, handleResizeEnd]);

    /**
     * Initiates tab drag operation
     * @param {Tab} tab - The tab being dragged
     * @param {number} tabIndex - Index of the tab in its group
     * @param {number} groupIndex - Index of the group containing the tab
     */
    const handleDragStart = useCallback((tab, tabIndex, groupIndex) => {
        debug("tabManagement", "Starting drag", { tabIndex, groupIndex });
        handleDragStateUpdate({
            draggedTab: tab,
            draggedTabIndex: tabIndex,
            sourceGroupIndex: groupIndex,
        });
    }, [handleDragStateUpdate]);

    /**
     * Handles drop indicator changes during drag operations
     */
    const handleDropIndicatorChange = (mouseX, mouseY, containerRect, headerRect, groupIndex, edgeThreshold, isFirstGroup, isLastGroup) => {
        showIndicators(mouseX, mouseY, containerRect, headerRect, groupIndex, edgeThreshold, isFirstGroup, isLastGroup);
    };

    /**
     * Handles moving tabs within and between groups
     * @param {Array<Tab>|[Tab, number]} newTabs - Either array of tabs (reorder) or [sourceTab, targetIndex] (move)
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {number} [targetGroupIndex] - Index of target group (if moving between groups)
     */
    const handleTabMove = useCallback((newTabs, sourceGroupIndex, targetGroupIndex) => {
        debug("tabManagement", "Moving tab", { sourceGroupIndex, targetGroupIndex });

        // Reset drag states
        handleDragStateReset();

        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];

            if (targetGroupIndex !== undefined) {
                // Moving between groups
                const [sourceTab, dropIndex] = newTabs;
                const sourceGroup = [...prevGroups[sourceGroupIndex]];

                // Find and remove the tab from source group
                const sourceTabIndex = sourceGroup.findIndex(tab => tab.key === sourceTab.key);
                if (sourceTabIndex === -1) {
                    debug("tabManagement", "Source tab not found", sourceTab);
                    return prevGroups;
                }

                // Get the actual tab object with all its properties
                const movedTab = sourceGroup[sourceTabIndex];
                sourceGroup.splice(sourceTabIndex, 1);

                // Handle empty source group
                if (sourceGroup.length === 0) {
                    debug("tabManagement", "Removing empty source group");
                    newGroups.splice(sourceGroupIndex, 1);
                    if (targetGroupIndex > sourceGroupIndex) {
                        targetGroupIndex--;
                    }
                } else {
                    newGroups[sourceGroupIndex] = sourceGroup;
                }

                // Add to target group
                const targetGroup = [...(newGroups[targetGroupIndex] || [])];
                targetGroup.splice(dropIndex, 0, movedTab);
                newGroups[targetGroupIndex] = targetGroup;
            } else {
                // Reordering within same group
                newGroups[sourceGroupIndex] = newTabs.map(tab => {
                    // Find the original tab object to preserve all properties
                    return prevGroups[sourceGroupIndex].find(t => t.key === tab.key) || tab;
                });
            }

            debug("tabManagement", "Updated groups:", newGroups);
            return newGroups;
        });
    }, [handleDragStateReset]);

    /**
     * Splits a tab into a new tab group
     * @param {Tab} tabInfo - Information about the tab to split
     * @param {number} sourceGroupIndex - Index of the group containing the tab
     * @param {number|boolean} targetPosition - Where to place the new group
     */
    const handleTabSplit = useCallback((tabInfo, sourceGroupIndex, targetPosition) => {
        debug("tabSplit", "Starting split operation", {
            sourceGroupIndex,
            targetPosition,
            tabInfo: {
                type: tabInfo.type,
                key: tabInfo.key,
            },
        });

        // Reset drag states
        handleDragStateReset();

        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];

            // Find the source tab using multiple strategies
            let sourceTab = findSourceTab(sourceGroup, tabInfo);
            
            if (!sourceTab) {
                debug("tabSplit", "Source tab not found");
                return prevGroups;
            }

            debug("tabSplit", "Found source tab:", {
                tabName: sourceTab.type.name,
                key: sourceTab.key,
            });

            // Remove from source group
            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);

            // Create new tab object preserving all properties
            const newTab = {
                ...sourceTab,
                key: `${sourceTab.type.name}-${Date.now()}`,
                type: {
                    ...sourceTab.type,
                    name: sourceTab.type.name,
                    component: sourceTab.type.component,
                    minWidth: sourceTab.type.minWidth || 200,
                },
            };

            // Create new group with the copied tab
            const newGroup = [newTab];

            // Handle empty source group
            if (sourceGroup.length === 0) {
                debug("tabSplit", "Removing empty source group");
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === "number" && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            // Insert new group at specified position
            if (typeof targetPosition === "number") {
                debug("tabSplit", "Inserting at specific position:", targetPosition);
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                debug("tabSplit", "Appending to end");
                newGroups.push(newGroup);
            } else {
                debug("tabSplit", "Prepending to start");
                newGroups.unshift(newGroup);
            }

            // Clean up global reference if it exists
            if (window.__lastDraggedTabComponent) {
                delete window.__lastDraggedTabComponent;
            }

            return newGroups;
        });
    }, [handleDragStateReset]);

    /**
     * Helper function to find a source tab using multiple strategies
     * @param {Array<Tab>} sourceGroup - The group to search in
     * @param {Object} tabInfo - Information about the tab to find
     * @returns {Tab|null} The found tab or null
     */
    const findSourceTab = (sourceGroup, tabInfo) => {
        // 1. Try to find by exact type name match
        let sourceTab = sourceGroup.find(tab => tab.type.name === tabInfo.type);

        // 2. If not found and we have a global reference, try to find by key
        if (!sourceTab && window.__lastDraggedTabComponent) {
            sourceTab = sourceGroup.find(tab => tab.key === window.__lastDraggedTabComponent.key);
        }

        // 3. If still not found, try to find by component name
        if (!sourceTab && tabInfo.component) {
            sourceTab = sourceGroup.find(tab => tab.type.component?.name === tabInfo.component);
        }

        return sourceTab;
    };

    /**
     * Handles tab selection and updates active tab tracking
     * @param {Object} tab - The tab being clicked
     * @param {number} tabIndex - Index of the tab in its group
     * @param {number} groupIndex - Index of the group containing the tab
     */
    const handleTabClick = useCallback((tab, tabIndex, groupIndex) => {
        if (tab && tab.type && tab.type.name) {
            setActiveTabTypes(prev => ({
                ...prev,
                [groupIndex]: tab.type.name
            }));
        }
    }, []);

    return {
        tabGroups,
        setTabGroups,
        flexBasis,
        setFlexBasis,
        isResizing,
        draggedTab: dragState.draggedTab,
        draggedTabIndex: dragState.draggedTabIndex,
        sourceGroupIndex: dragState.sourceGroupIndex,
        dropIndicators,
        handleTabMove,
        handleTabSplit,
        handleResize,
        handleDragStart,
        handleDragEnd,
        handleDropIndicatorChange,
        determineDropAction,
        handleTabClick,
        tabContainerProps: {
            onTabMove: handleTabMove,
            onTabSplit: handleTabSplit,
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onDropIndicatorChange: handleDropIndicatorChange,
            determineDropAction,
            onResize: handleResize,
            onTabClick: handleTabClick,
            dropIndicators
        }
    };
};

export default useTabManagement;
