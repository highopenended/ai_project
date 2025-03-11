import { useState, useEffect, useCallback, useRef } from "react";
import { debug, trackPerformance, createMark, configureDebug } from '../../../../utils/debugUtils';

// Configure debug for this module
configureDebug({
    areas: {
        tabManagement: false, // Set to true to enable debugging for this module
        tabSplit: false, // For tab splitting operations
    }
});

// Constants
const MIN_WIDTH_PX = 200;
const RESIZE_THROTTLE_MS = 16; // ~60fps

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
    const [dragState, setDragState] = useState({
        isResizing: false,
        draggedTab: null,
        draggedTabIndex: null,
        sourceGroupIndex: null,
        dropIndicators: {
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null,
            betweenGroupsRight: null,
        },
        lastResizeTime: 0,
    });

    // Add ref to track resize state
    const resizeRef = useRef({
        active: false,
        handler: null,
    });

    // Memoize container width calculation
    const getContainerWidth = useCallback(() => {
        const container = document.querySelector(".shop-generator");
        return container ? container.clientWidth : 0;
    }, []);

    // Batch update drag state
    const updateDragState = useCallback((updates) => {
        setDragState((prev) => ({
            ...prev,
            ...updates,
        }));
        debug("State", "Updating drag state", updates);
    }, []);

    // Handle drag end with batched updates
    const handleDragEnd = useCallback(() => {
        debug("Action", "Ending drag/resize operation");
        updateDragState({
            isResizing: false,
            draggedTab: null,
            draggedTabIndex: null,
            sourceGroupIndex: null,
            dropIndicators: {
                leftGroup: null,
                rightGroup: null,
                betweenGroups: null,
                betweenGroupsRight: null,
            },
        });
    }, [updateDragState]);

    // Resize handler with throttling
    const handleResize = useCallback(
        (newWidth, groupIndex) => {
            const startMark = createMark('tabManagement', 'Resize Operation');

            if (groupIndex >= tabGroups.length - 1) {
                debug("Resize", "Invalid group index", { groupIndex });
                return;
            }

            const now = Date.now();
            if (now - dragState.lastResizeTime < RESIZE_THROTTLE_MS) {
                debug("Resize", "Throttled", {
                    timeSinceLastResize: now - dragState.lastResizeTime,
                    throttleLimit: RESIZE_THROTTLE_MS,
                });
                return;
            }

            debug("Resize", "Processing resize", {
                groupIndex,
                newWidth,
                isActive: resizeRef.current.active,
                timeSinceLastResize: now - dragState.lastResizeTime,
            });

            const totalWidth = getContainerWidth();
            if (!totalWidth) {
                debug("Resize", "No container width available");
                return;
            }

            updateDragState({
                isResizing: true,
                lastResizeTime: now,
            });

            setFlexBasis((prev) => {
                const newBasis = [...prev];
                const minWidthPercent = (MIN_WIDTH_PX / totalWidth) * 100;

                let currentPercent = Math.max((newWidth / totalWidth) * 100, minWidthPercent);

                const remainingPercent = parseFloat(prev[groupIndex]) + parseFloat(prev[groupIndex + 1]);
                const nextGroupPercent = remainingPercent - currentPercent;

                if (nextGroupPercent < minWidthPercent) {
                    debug("Resize", "Next group would be too small", {
                        nextGroupPercent,
                        minWidthPercent,
                    });
                    return prev;
                }

                newBasis[groupIndex] = `${currentPercent}%`;
                newBasis[groupIndex + 1] = `${nextGroupPercent}%`;

                debug("Resize", "Updated basis", {
                    current: currentPercent,
                    next: nextGroupPercent,
                    total: currentPercent + nextGroupPercent,
                });

                trackPerformance('tabManagement', 'Resize Operation', startMark);
                return newBasis;
            });
        },
        [tabGroups.length, dragState.lastResizeTime, getContainerWidth, updateDragState]
    );

    // Resize handler initialization
    useEffect(() => {
        const mountTime = Date.now();
        const currentRef = resizeRef.current;
        const effectId = Math.random().toString(36).slice(2, 11);

        debug("Lifecycle", `[Effect ${effectId}] Resize handler initialized`, {
            mountTime,
            handlerExists: !!currentRef.handler,
        });

        const handleGlobalMouseUp = () => {
            if (!currentRef.active) return;

            const startMark = createMark('tabManagement', 'Mouse Up Handler');

            debug("Mouse", `[Effect ${effectId}] Global mouse up`, {
                timeSinceMount: Date.now() - mountTime,
            });

            handleDragEnd();
            currentRef.active = false;

            trackPerformance('tabManagement', 'Mouse Up Handler', startMark);
        };

        currentRef.handler = handleGlobalMouseUp;
        window.addEventListener("mouseup", handleGlobalMouseUp);

        return () => {
            debug("Cleanup", `[Effect ${effectId}] Removing resize handler`, {
                timeActive: Date.now() - mountTime,
                hadHandler: !!currentRef.handler,
            });
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            currentRef.handler = null;
        };
    }, [handleDragEnd]);

    // Track resize state separately
    useEffect(() => {
        const effectId = Math.random().toString(36).substr(2, 9);
        const currentRef = resizeRef.current;

        if (!dragState.isResizing) {
            if (currentRef.active) {
                debug("State", `[Effect ${effectId}] Deactivating resize`, {
                    draggedTab: dragState.draggedTab?.type?.name,
                });
                currentRef.active = false;
            }
            return;
        }

        debug("State", `[Effect ${effectId}] Activating resize`, {
            draggedTab: dragState.draggedTab?.type?.name,
        });
        currentRef.active = true;

        return () => {
            if (currentRef.active) {
                debug("State", `[Effect ${effectId}] Cleaning up resize state`);
                currentRef.active = false;
            }
        };
    }, [dragState.isResizing, dragState.draggedTab?.type?.name]);

    // Handle drag start with batched update
    const handleDragStart = useCallback(
        (tab, tabIndex, groupIndex) => {
            debug("Action", "Starting drag", { tabIndex, groupIndex });
            updateDragState({
                draggedTab: tab,
                draggedTabIndex: tabIndex,
                sourceGroupIndex: groupIndex,
            });
        },
        [updateDragState]
    );

    // Handle drop indicators with batched update
    const handleDropIndicatorChange = useCallback(
        (indicators) => {
            updateDragState({
                dropIndicators: { ...dragState.dropIndicators, ...indicators },
            });
        },
        [dragState.dropIndicators, updateDragState]
    );

    /**
     * Handles moving tabs within and between groups while preserving component state
     *
     * @param {Array<Tab>|[Tab, number]} newTabs - Either array of tabs (reorder) or [sourceTab, targetIndex] (move)
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {number} [targetGroupIndex] - Index of target group (if moving between groups)
     *
     * Key Behaviors:
     * 1. Within Group: Preserves original tab objects while reordering
     * 2. Between Groups: Moves complete tab object with all properties
     * 3. Empty Groups: Removes source group if it becomes empty
     *
     * State Preservation:
     * - Uses tab.key for reliable identification
     * - Maintains original component references
     * - Preserves memoized props from registry
     */
    const handleTabMove = useCallback(
        (newTabs, sourceGroupIndex, targetGroupIndex) => {
            debug("Action", "Moving tab", { sourceGroupIndex, targetGroupIndex });

            // Reset drag states
            updateDragState({
                draggedTab: null,
                draggedTabIndex: null,
                sourceGroupIndex: null,
                dropIndicators: {
                    leftGroup: null,
                    rightGroup: null,
                    betweenGroups: null,
                    betweenGroupsRight: null,
                },
            });

            setTabGroups((prevGroups) => {
                const newGroups = [...prevGroups];

                if (targetGroupIndex !== undefined) {
                    // Moving between groups
                    const [sourceTab, dropIndex] = newTabs;
                    const sourceGroup = [...prevGroups[sourceGroupIndex]];

                    // Find and remove the tab from source group
                    const sourceTabIndex = sourceGroup.findIndex((tab) => tab.key === sourceTab.key);

                    if (sourceTabIndex === -1) {
                        debug("Move", "Source tab not found", sourceTab);
                        return prevGroups;
                    }

                    // Get the actual tab object with all its properties
                    const movedTab = sourceGroup[sourceTabIndex];
                    sourceGroup.splice(sourceTabIndex, 1);

                    // Handle empty source group
                    if (sourceGroup.length === 0) {
                        debug("Move", "Removing empty source group");
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
                    newGroups[sourceGroupIndex] = newTabs.map((tab) => {
                        // Find the original tab object to preserve all properties
                        const originalTab = prevGroups[sourceGroupIndex].find((t) => t.key === tab.key);
                        return originalTab || tab;
                    });
                }

                debug("Move", "Updated groups:", newGroups);
                return newGroups;
            });
        },
        [updateDragState]
    );

    /**
     * Split a tab into a new tab group
     * @param {Object} tabInfo - Information about the tab to split
     * @param {number} sourceGroupIndex - Index of the group containing the tab
     * @param {*} targetPosition - Where to place the new group
     */
    const handleTabSplit = useCallback(
        (tabInfo, sourceGroupIndex, targetPosition) => {
            debug("tabSplit", "Starting split operation:", {
                sourceGroupIndex,
                targetPosition,
                tabInfo: {
                    type: tabInfo.type,
                    key: tabInfo.key,
                    component: tabInfo.component,
                },
            });

            // Reset drag states
            updateDragState({
                draggedTab: null,
                draggedTabIndex: null,
                sourceGroupIndex: null,
                dropIndicators: {
                    leftGroup: null,
                    rightGroup: null,
                    betweenGroups: null,
                    betweenGroupsRight: null,
                },
            });

            setTabGroups((prevGroups) => {
                const newGroups = [...prevGroups];
                const sourceGroup = [...prevGroups[sourceGroupIndex]];

                debug("tabSplit", "Finding source tab in group:", {
                    sourceGroupSize: sourceGroup.length,
                    searchType: tabInfo.type,
                    availableTypes: sourceGroup.map((tab) => ({
                        name: tab.type.name,
                        component: tab.type.component?.name,
                    })),
                });

                // Try to find the source tab using multiple methods
                let sourceTab = null;

                // 1. Try to find by exact type name match
                sourceTab = sourceGroup.find((tab) => tab.type.name === tabInfo.type);

                // 2. If not found and we have a global reference, try to find by key
                if (!sourceTab && window.__lastDraggedTabComponent) {
                    debug("tabSplit", "Trying to find tab by key from global reference");
                    sourceTab = sourceGroup.find((tab) => tab.key === window.__lastDraggedTabComponent.key);
                }

                // 3. If still not found, try to find by component name
                if (!sourceTab && tabInfo.component) {
                    debug("tabSplit", "Trying to find tab by component name");
                    sourceTab = sourceGroup.find((tab) => tab.type.component?.name === tabInfo.component);
                }

                if (!sourceTab) {
                    debug("tabSplit", "Source tab not found");
                    return prevGroups;
                }

                debug("tabSplit", "Found source tab:", {
                    tabName: sourceTab.type.name,
                    hasComponent: !!sourceTab.type.component,
                    componentName: sourceTab.type.component?.name,
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

                debug("tabSplit", "Created new tab:", {
                    newTabType: newTab.type.name,
                    hasComponent: !!newTab.type.component,
                    componentName: newTab.type.component?.name,
                    key: newTab.key,
                });

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

                debug("tabSplit", "Final group structure:", {
                    groupCount: newGroups.length,
                    groups: newGroups.map((g) =>
                        g.map((t) => ({
                            name: t.type.name,
                            component: t.type.component?.name,
                            key: t.key,
                        }))
                    ),
                });

                // Clean up global reference after successful split
                delete window.__lastDraggedTabComponent;

                return newGroups;
            });
        },
        [updateDragState]
    );

    // Initialize flex basis when group count changes
    useEffect(() => {
        // Early return if no change needed
        if (tabGroups.length === flexBasis.length) {
            debug("FlexBasis", "No update needed", {
                groupCount: tabGroups.length,
            });
            return;
        }

        const groupCount = tabGroups.length;
        debug("FlexBasis", "Updating widths", {
            groupCount,
        });

        const defaultWidths = Array(groupCount).fill(`${100 / groupCount}%`);
        setFlexBasis(defaultWidths);

        debug("FlexBasis", "Updated widths", { newWidths: defaultWidths });
    }, [tabGroups, flexBasis.length]);

    return {
        tabGroups,
        setTabGroups,
        flexBasis,
        setFlexBasis,
        isResizing: dragState.isResizing,
        draggedTab: dragState.draggedTab,
        draggedTabIndex: dragState.draggedTabIndex,
        sourceGroupIndex: dragState.sourceGroupIndex,
        dropIndicators: dragState.dropIndicators,
        handleTabMove,
        handleTabSplit,
        handleResize,
        handleDragStart,
        handleDragEnd,
        handleDropIndicatorChange,
    };
};
