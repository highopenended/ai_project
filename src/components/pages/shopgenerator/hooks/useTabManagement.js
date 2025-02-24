import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';

// Constants for tab state management
export const STORAGE_KEY = "tabGroupsState";

// Debug configuration - import from a shared config if needed
const DEBUG_CONFIG = {
    enabled: false,
    areas: {
        tabManagement: false
    }
};

// Debug logger
const debug = (area, message, data = '') => {
    if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.areas[area]) return;
    const timestamp = performance.now().toFixed(2);
    console.log(`[TabManagement][${timestamp}ms] ${area}:`, message, data ? data : '');
};

// Performance tracking
const trackPerformance = (name, startMark = null) => {
    if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.areas.tabManagement) return;
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
            debug('Performance', `${name} operation took`, `${lastMeasurement.duration.toFixed(2)}ms`);
        } catch (e) {
            debug('Performance', `Error measuring ${name}`, e);
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
 * @param {Object} defaultConfig - The default tab configuration
 * @param {Function} createTabElement - Function to create a tab element with proper props
 * @returns {Object} Tab management handlers and state
 * @property {string} activeTab - Currently active tab
 * @property {Function} setActiveTab - Function to change active tab
 * @property {Object} tabContent - Content to render for current tab
 * @property {Function} handleTabChange - Handler for tab change events
 */
export const useTabManagement = (defaultConfig, createTabElement) => {
    // Internal helper to transform saved configuration into React elements
    const createTabsFromConfig = useCallback((config) => {
        debug('tabCreation', 'Creating tabs from config:', config);
        
        // Process each group
        const processedGroups = config.groups.map(group => {
            if (!Array.isArray(group)) {
                return [];
            }

            return group.map(tab => {
                if (!tab.type) {
                    return null;
                }
                return createTabElement(tab.type, tab.key);
            }).filter(Boolean);
        }).filter(group => group.length > 0);

        // If no valid groups were created, use default config
        if (processedGroups.length === 0) {
            return defaultConfig;
        }

        // Ensure we have the correct number of widths
        let widths = config.widths;
        if (widths.length !== processedGroups.length) {
            widths = processedGroups.map((_, i) => 
                i === processedGroups.length - 1 ? '100%' : `${100 / processedGroups.length}%`
            );
        }

        return {
            groups: processedGroups,
            widths: widths
        };
    }, [defaultConfig, createTabElement]);

    // Load initial state from localStorage or use default
    const [tabGroups, setTabGroups] = useState(() => {
        try {
            debug('initialization', 'Loading saved tab state');
            const savedState = localStorage.getItem(STORAGE_KEY);
            
            if (!savedState) {
                return defaultConfig.groups;
            }

            const parsed = JSON.parse(savedState);
            if (!parsed || !Array.isArray(parsed.groups)) {
                return defaultConfig.groups;
            }

            const newState = createTabsFromConfig(parsed);
            return newState.groups;
        } catch (error) {
            debug('initialization', 'Error loading saved state:', error);
            return defaultConfig.groups;
        }
    });

    const [flexBasis, setFlexBasis] = useState(() => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) {
                return defaultConfig.widths;
            }

            const parsed = JSON.parse(savedState);
            if (!parsed || !Array.isArray(parsed.widths)) {
                return defaultConfig.widths;
            }

            const newState = createTabsFromConfig(parsed);
            return newState.widths;
        } catch (error) {
            debug('initialization', 'Error loading flexBasis from localStorage:', error);
            return defaultConfig.widths;
        }
    });

    // Save state whenever tab groups or widths change
    useEffect(() => {
        const saveState = () => {
            debug('stateSync', 'Saving tab state');
            
            // Extract the original tab type identifiers
            const groupsData = tabGroups.map(group =>
                group.map(tab => ({
                    type: tab.type.name,
                    key: tab.key
                }))
            );

            const stateToSave = {
                groups: groupsData,
                widths: flexBasis,
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        };

        saveState();
    }, [tabGroups, flexBasis]);

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
        debug('State', 'Updating drag state', updates);
    }, []);

    // Handle drag end with batched updates
    const handleDragEnd = useCallback(() => {
        debug('Action', 'Ending drag/resize operation');
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
            debug('Resize', 'Invalid group index', { groupIndex });
            return;
        }

        const now = Date.now();
        if (now - dragState.lastResizeTime < RESIZE_THROTTLE_MS) {
            debug('Resize', 'Throttled', { 
                timeSinceLastResize: now - dragState.lastResizeTime,
                throttleLimit: RESIZE_THROTTLE_MS 
            });
            return;
        }

        debug('Resize', 'Processing resize', { 
            groupIndex, 
            newWidth,
            isActive: resizeRef.current.active,
            timeSinceLastResize: now - dragState.lastResizeTime
        });
        
        const totalWidth = getContainerWidth();
        if (!totalWidth) {
            debug('Resize', 'No container width available');
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
                debug('Resize', 'Next group would be too small', { 
                    nextGroupPercent,
                    minWidthPercent
                });
                return prev;
            }

            newBasis[groupIndex] = `${currentPercent}%`;
            newBasis[groupIndex + 1] = `${nextGroupPercent}%`;
            
            debug('Resize', 'Updated basis', { 
                current: currentPercent,
                next: nextGroupPercent,
                total: currentPercent + nextGroupPercent
            });
            
            trackPerformance('Resize Operation', startMark);
            return newBasis;
        });
    }, [tabGroups.length, dragState.lastResizeTime, getContainerWidth, updateDragState]);

    // Resize handler initialization
    useEffect(() => {
        const mountTime = Date.now();
        const currentRef = resizeRef.current;
        const effectId = Math.random().toString(36).slice(2, 11);
        
        debug('Lifecycle', `[Effect ${effectId}] Resize handler initialized`, {
            mountTime,
            handlerExists: !!currentRef.handler
        });
        
        const handleGlobalMouseUp = () => {
            if (!currentRef.active) return;
            
            const startMark = `mouseup-${effectId}-${Date.now()}`;
            performance.mark(startMark);
            
            debug('Mouse', `[Effect ${effectId}] Global mouse up`, {
                timeSinceMount: Date.now() - mountTime
            });
            
            handleDragEnd();
            currentRef.active = false;
            
            trackPerformance('Mouse Up Handler', startMark);
        };

        currentRef.handler = handleGlobalMouseUp;
        window.addEventListener("mouseup", handleGlobalMouseUp);

        return () => {
            debug('Cleanup', `[Effect ${effectId}] Removing resize handler`, {
                timeActive: Date.now() - mountTime,
                hadHandler: !!currentRef.handler
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
                debug('State', `[Effect ${effectId}] Deactivating resize`, {
                    draggedTab: dragState.draggedTab?.type?.name
                });
                currentRef.active = false;
            }
            return;
        }
        
        debug('State', `[Effect ${effectId}] Activating resize`, {
            draggedTab: dragState.draggedTab?.type?.name
        });
        currentRef.active = true;

        return () => {
            if (currentRef.active) {
                debug('State', `[Effect ${effectId}] Cleaning up resize state`);
                currentRef.active = false;
            }
        };
    }, [dragState.isResizing, dragState.draggedTab?.type?.name]);

    // Handle drag start with batched update
    const handleDragStart = useCallback((tab, tabIndex, groupIndex) => {
        debug('Action', 'Starting drag', { tabIndex, groupIndex });
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
        debug('Action', 'Moving tab', { sourceGroupIndex, targetGroupIndex });

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

                debug('Move', 'Processing tab move', { 
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
                    debug('Move', 'Removing empty source group');
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
                    debug('Move', 'Moving back to original group');
                    targetGroup.splice(dropIndex, 0, sourceTab);
                } else {
                    debug('Move', 'Creating new tab in target group');
                    const newTab = React.cloneElement(sourceTab, {
                        key: `${sourceTab.type.name}-${Date.now()}`,
                    });
                    targetGroup.splice(dropIndex, 0, newTab);
                }

                newGroups[targetGroupIndex] = targetGroup;
            } else {
                debug('Move', 'Reordering within same group');
                newGroups[sourceGroupIndex] = newTabs;
            }

            debug('Move', 'Completed tab move', { 
                finalGroupCount: newGroups.length 
            });
            return newGroups;
        });
    }, [updateDragState]);

    /**
     * Handles creating new groups by splitting existing ones
     */
    const handleTabSplit = useCallback((tabInfo, sourceGroupIndex, targetPosition) => {
        debug('Action', 'Splitting tab', { sourceGroupIndex, targetPosition });

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
                debug('Split', 'Source tab not found', tabInfo);
                return prevGroups;
            }

            debug('Split', 'Processing tab split', {
                sourceTab: sourceTab.type.name,
                sourceGroupSize: sourceGroup.length
            });

            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`,
            });
            const newGroup = [newTab];

            if (sourceGroup.length === 0) {
                debug('Split', 'Removing empty source group');
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === "number" && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            if (typeof targetPosition === "number") {
                debug('Split', 'Inserting at specific position', { targetPosition });
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                debug('Split', 'Appending to end');
                newGroups.push(newGroup);
            } else {
                debug('Split', 'Prepending to start');
                newGroups.unshift(newGroup);
            }

            debug('Split', 'Completed tab split', { 
                finalGroupCount: newGroups.length 
            });
            return newGroups;
        });
    }, [updateDragState]);

    // Initialize flex basis when group count changes
    useEffect(() => {
        // Early return if no change needed
        if (tabGroups.length === flexBasis.length) {
            debug('FlexBasis', 'No update needed', { 
                groupCount: tabGroups.length
            });
            return;
        }
        
        const groupCount = tabGroups.length;
        debug('FlexBasis', 'Updating widths', { 
            groupCount
        });
        
        const defaultWidths = Array(groupCount).fill(`${100 / groupCount}%`);
        setFlexBasis(defaultWidths);
        
        debug('FlexBasis', 'Updated widths', { newWidths: defaultWidths });
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