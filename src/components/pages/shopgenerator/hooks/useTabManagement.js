import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';

// Debug logger
const DEBUG = true;
const log = (area, message, data = '') => {
    if (!DEBUG) return;
    const timestamp = performance.now().toFixed(2);
    console.log(`[TabManagement][${timestamp}ms] ${area}:`, message, data ? data : '');
};

// Performance tracking
const trackPerformance = (name, startMark = null) => {
    if (!DEBUG) return;
    const endMark = `${name}-end-${Date.now()}`;
    performance.mark(endMark);
    
    if (startMark) {
        try {
            performance.measure(
                `TabManagement - ${name}`,
                startMark,
                endMark
            );
            const measurements = performance.getEntriesByName(`TabManagement - ${name}`);
            const lastMeasurement = measurements[measurements.length - 1];
            log('Performance', `${name} operation took`, `${lastMeasurement.duration.toFixed(2)}ms`);
        } catch (e) {
            log('Performance', `Error measuring ${name}`, e);
        }
    }
    return endMark;
};

// Constants
const MIN_WIDTH_PX = 200;
const RESIZE_THROTTLE_MS = 16; // ~60fps

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
        lastResizeTime: 0
    });

    // Add ref to track resize state
    const resizeRef = useRef({
        active: false,
        handler: null
    });

    // Memoize container width calculation
    const getContainerWidth = useCallback(() => {
        const container = document.querySelector(".shop-generator");
        return container ? container.clientWidth : 0;
    }, []);

    // Batch update drag state
    const updateDragState = useCallback((updates) => {
        setDragState(prev => ({
            ...prev,
            ...updates
        }));
        log('State', 'Updating drag state', updates);
    }, []);

    // Handle drag end with batched updates
    const handleDragEnd = useCallback(() => {
        log('Action', 'Ending drag/resize operation');
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
            }
        });
    }, [updateDragState]);

    // Resize handler with throttling
    const handleResize = useCallback((newWidth, groupIndex) => {
        const startMark = `resize-op-${Date.now()}`;
        performance.mark(startMark);
        
        if (groupIndex >= tabGroups.length - 1) {
            log('Resize', 'Invalid group index', { groupIndex });
            return;
        }

        const now = Date.now();
        if (now - dragState.lastResizeTime < RESIZE_THROTTLE_MS) {
            log('Resize', 'Throttled', { 
                timeSinceLastResize: now - dragState.lastResizeTime,
                throttleLimit: RESIZE_THROTTLE_MS 
            });
            return;
        }

        log('Resize', 'Processing resize', { 
            groupIndex, 
            newWidth,
            isActive: resizeRef.current.active,
            timeSinceLastResize: now - dragState.lastResizeTime
        });
        
        const totalWidth = getContainerWidth();
        if (!totalWidth) {
            log('Resize', 'No container width available');
            return;
        }

        updateDragState({
            isResizing: true,
            lastResizeTime: now
        });

        setFlexBasis(prev => {
            const newBasis = [...prev];
            const minWidthPercent = (MIN_WIDTH_PX / totalWidth) * 100;
            
            let currentPercent = Math.max(
                (newWidth / totalWidth) * 100,
                minWidthPercent
            );
            
            const remainingPercent = parseFloat(prev[groupIndex]) + parseFloat(prev[groupIndex + 1]);
            const nextGroupPercent = remainingPercent - currentPercent;

            if (nextGroupPercent < minWidthPercent) {
                log('Resize', 'Next group would be too small', { 
                    nextGroupPercent,
                    minWidthPercent
                });
                return prev;
            }

            newBasis[groupIndex] = `${currentPercent}%`;
            newBasis[groupIndex + 1] = `${nextGroupPercent}%`;
            
            log('Resize', 'Updated basis', { 
                current: currentPercent,
                next: nextGroupPercent,
                total: currentPercent + nextGroupPercent
            });
            
            trackPerformance('Resize Operation', startMark);
            return newBasis;
        });
    }, [tabGroups.length, dragState.lastResizeTime, getContainerWidth, updateDragState]);

    // Single resize handler initialization
    useEffect(() => {
        const mountTime = Date.now();
        const currentRef = resizeRef.current;
        
        log('Lifecycle', 'Initializing resize handler', {
            mountTime,
            handlerExists: !!currentRef.handler
        });
        
        const handleGlobalMouseUp = () => {
            if (!currentRef.active) return;
            
            const startMark = `mouseup-${Date.now()}`;
            performance.mark(startMark);
            
            log('Mouse', 'Global mouse up - ending resize', {
                timeSinceMount: Date.now() - mountTime
            });
            
            handleDragEnd();
            currentRef.active = false;
            
            trackPerformance('Mouse Up Handler', startMark);
        };

        currentRef.handler = handleGlobalMouseUp;
        window.addEventListener("mouseup", handleGlobalMouseUp);

        return () => {
            log('Cleanup', 'Removing resize handler', {
                timeActive: Date.now() - mountTime,
                hadHandler: !!currentRef.handler
            });
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            currentRef.handler = null;
        };
    }, [handleDragEnd]); // Only depend on stable callback

    // Track resize state
    useEffect(() => {
        const currentRef = resizeRef.current;
        if (!dragState.isResizing) return;
        
        log('State', 'Starting resize operation');
        performance.mark('resize-start');
        resizeRef.current.active = true;
        
        return () => {
            if (currentRef.active) {
                log('State', 'Cleaning up resize operation');
                currentRef.active = false;
            }
        };
    }, [dragState.isResizing]);

    // Handle drag start with batched update
    const handleDragStart = useCallback((tab, tabIndex, groupIndex) => {
        log('Action', 'Starting drag', { tabIndex, groupIndex });
        updateDragState({
            draggedTab: tab,
            draggedTabIndex: tabIndex,
            sourceGroupIndex: groupIndex
        });
    }, [updateDragState]);

    // Handle drop indicators with batched update
    const handleDropIndicatorChange = useCallback((indicators) => {
        updateDragState({
            dropIndicators: { ...dragState.dropIndicators, ...indicators }
        });
    }, [dragState.dropIndicators, updateDragState]);

    /**
     * Handles moving tabs within and between groups
     */
    const handleTabMove = useCallback((newTabs, sourceGroupIndex, targetGroupIndex) => {
        log('Action', 'Moving tab', { sourceGroupIndex, targetGroupIndex });

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
            }
        });

        setTabGroups((prevGroups) => {
            const newGroups = [...prevGroups];

            if (targetGroupIndex !== undefined) {
                const [sourceTab, dropIndex] = newTabs;
                const sourceGroup = [...prevGroups[sourceGroupIndex]];

                log('Move', 'Processing tab move', { 
                    sourceTab: sourceTab.type.name,
                    dropIndex,
                    sourceGroupSize: sourceGroup.length 
                });

                const sourceTabIndex = sourceGroup.findIndex(
                    (tab) => tab.type.name === sourceTab.type.name && (!tab.key || tab.key === sourceTab.key)
                );
                if (sourceTabIndex !== -1) {
                    sourceGroup.splice(sourceTabIndex, 1);
                }

                if (sourceGroup.length === 0) {
                    log('Move', 'Removing empty source group');
                    newGroups.splice(sourceGroupIndex, 1);
                    if (targetGroupIndex > sourceGroupIndex) {
                        targetGroupIndex--;
                    }
                } else {
                    newGroups[sourceGroupIndex] = sourceGroup;
                }

                const targetGroup = [...(newGroups[targetGroupIndex] || [])];
                const isMovingBackToOriginal = sourceGroupIndex === targetGroupIndex;

                if (isMovingBackToOriginal) {
                    log('Move', 'Moving back to original group');
                    targetGroup.splice(dropIndex, 0, sourceTab);
                } else {
                    log('Move', 'Creating new tab in target group');
                    const newTab = React.cloneElement(sourceTab, {
                        key: `${sourceTab.type.name}-${Date.now()}`,
                    });
                    targetGroup.splice(dropIndex, 0, newTab);
                }

                newGroups[targetGroupIndex] = targetGroup;
            } else {
                log('Move', 'Reordering within same group');
                newGroups[sourceGroupIndex] = newTabs;
            }

            log('Move', 'Completed tab move', { 
                finalGroupCount: newGroups.length 
            });
            return newGroups;
        });
    }, [updateDragState]);

    /**
     * Handles creating new groups by splitting existing ones
     */
    const handleTabSplit = useCallback((tabInfo, sourceGroupIndex, targetPosition) => {
        log('Action', 'Splitting tab', { sourceGroupIndex, targetPosition });

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
            }
        });

        setTabGroups((prevGroups) => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];
            const sourceTab = sourceGroup.find((tab) => tab.type.name === tabInfo.type);

            if (!sourceTab) {
                log('Split', 'Source tab not found', tabInfo);
                return prevGroups;
            }

            log('Split', 'Processing tab split', {
                sourceTab: sourceTab.type.name,
                sourceGroupSize: sourceGroup.length
            });

            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`,
            });
            const newGroup = [newTab];

            if (sourceGroup.length === 0) {
                log('Split', 'Removing empty source group');
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === "number" && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            if (typeof targetPosition === "number") {
                log('Split', 'Inserting at specific position', { targetPosition });
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                log('Split', 'Appending to end');
                newGroups.push(newGroup);
            } else {
                log('Split', 'Prepending to start');
                newGroups.unshift(newGroup);
            }

            log('Split', 'Completed tab split', { 
                finalGroupCount: newGroups.length 
            });
            return newGroups;
        });
    }, [updateDragState]);

    // Initialize flex basis when group count changes
    useEffect(() => {
        // Early return if no change needed
        if (tabGroups.length === flexBasis.length) {
            log('FlexBasis', 'No update needed', { 
                groupCount: tabGroups.length
            });
            return;
        }
        
        const groupCount = tabGroups.length;
        log('FlexBasis', 'Updating widths', { 
            groupCount
        });
        
        const defaultWidths = Array(groupCount).fill(`${100 / groupCount}%`);
        setFlexBasis(defaultWidths);
        
        log('FlexBasis', 'Updated widths', { newWidths: defaultWidths });
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