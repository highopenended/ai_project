import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { debug } from '../../../../../utils/debugUtils';

import TabHeader from './TabHeader.jsx';
import './TabContainer.css';

/**
 * Custom hook to debounce function calls.
 * Prevents rapid-fire function execution by waiting for a pause in calls.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds before executing the function
 * @returns {Function} A debounced version of the callback
 */
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
}

/**
 * TabContainer Component
 * Manages a group of draggable tabs with support for:
 * - Drag and drop reordering within the same group
 * - Moving tabs between groups
 * - Creating new groups by dragging to edges
 * - Visual feedback during drag operations
 * 
 * State Management:
 * - activeTab: Currently selected tab in this group
 * - dropIndex: Current position where a dragged tab would be inserted
 * - tabRefs: References to tab DOM elements for position calculations
 * - originalPositions: Cached positions of tabs when drag starts
 * 
 * Key Behaviors:
 * 1. Drag Start: Caches original positions and sets up drag data
 * 2. Drag Over: Calculates drop positions and shows indicators
 * 3. Drop: Handles tab movement/reordering
 * 4. Drag End: Cleans up state and visual indicators
 * 
 * Common Issues & Solutions:
 * 1. Tabs jumping during drag: Check originalPositions and getTabStyle
 * 2. Incorrect drop positions: Verify dropIndex calculations
 * 3. Visual glitches: Ensure proper cleanup in handleDragEnd
 * 4. State inconsistencies: Check parent-child state sync
 */
function TabContainer({ 
    tabs, 
    onTabMove, 
    onTabSplit, 
    groupIndex,
    draggedTab,
    draggedTabIndex,
    dropIndicators,
    onDragStart,
    onDragEnd,
    onDropIndicatorChange,
    onTabClick,
    onResize,
    isLastGroup,
    style
}) {
    // Track active tab by type name instead of component reference
    const [activeTabType, setActiveTabType] = useState(tabs[0]?.type?.name);
    const [dropIndex, setDropIndex] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    
    const activeTab = tabs.find(tab => tab.type.name === activeTabType) || tabs[0];
    const activeTabName = activeTab?.type?.name;
    const containerRef = useRef(null);
    
    // Refs for DOM manipulation and position tracking
    const tabRefs = useRef({});  // Stores references to tab DOM elements
    const originalPositions = useRef([]); // Caches tab positions at drag start
    const edgeThreshold = 80; // Distance from edge to trigger group split
    const edgeHoldTimeout = useRef(null);

    // Get the maximum minWidth from all tabs in this group
    const groupMinWidth = Math.max(...tabs.map(tab => tab.type.minWidth || 200));

    // Merge the calculated minWidth with the provided style
    const containerStyle = {
        ...style,
        minWidth: `${groupMinWidth}px`
    };

    // Keep active tab valid when tabs array changes
    useEffect(() => {
        if (!tabs.some(tab => tab.type.name === activeTabType)) {
            setActiveTabType(tabs[0]?.type?.name);
        }
    }, [tabs, activeTabType]);

    // Debounce indicator changes to prevent rapid updates
    const debouncedDropIndicatorChange = useDebounce((indicators) => {
        onDropIndicatorChange(indicators);
    }, 50);

    /**
     * Handles tab selection
     * @param {Object} tab - The tab being clicked
     */
    const handleTabClick = (tab) => {
        setActiveTabType(tab.type.name);
        onTabClick?.(tab, tabs.indexOf(tab));
    };

    /**
     * Initializes drag operation
     * Caches original positions and sets up drag data
     */
    const handleDragStart = (e, tab, index) => {
        // Safety check for tab structure
        if (!tab || !tab.type) {
            debug("tabManagement", "Invalid tab structure for drag", tab);
            return;
        }

        debug("tabManagement", "Starting drag operation", {
            tabType: tab.type.name,
            index,
            groupIndex,
            component: tab.type.component?.name || 'unknown'
        });

        // Store the complete tab reference for production mode
        window.__lastDraggedTabComponent = tab;

        const tabElements = Array.from(e.currentTarget.parentElement.children);
        originalPositions.current = tabElements.map(tab => {
            const rect = tab.getBoundingClientRect();
            return {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                center: rect.left + rect.width / 2
            };
        });
        
        onDragStart(tab, index);
        
        // Enhanced data transfer for production mode
        const tabData = {
            type: tab.type,  // Store the complete type object
            index: index,
            key: tab.key,
            groupIndex: groupIndex
        };

        debug("tabManagement", "Setting drag data", tabData);
        
        try {
            // Set data in multiple formats for redundancy
            e.dataTransfer.setData('application/x-tab', 'true');
            e.dataTransfer.setData('text/plain', index.toString());
            e.dataTransfer.setData('groupIndex', groupIndex.toString());
            e.dataTransfer.setData('tabInfo', JSON.stringify(tabData));
        } catch (err) {
            debug("tabManagement", "Error setting drag data", err);
        }
    };

    /**
     * Handles drag over events
     * Calculates drop positions and updates indicators
     * Uses debouncing to prevent excessive updates
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        
        // Instead of trying to read the data, we'll accept the drop if it has our custom format
        if (!e.dataTransfer.types.includes('application/x-tab')) {
            return;
        }

        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get header area bounds
        const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
        const isOverHeader = mouseY >= headerRect.top && mouseY <= headerRect.bottom;
        
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            const distanceFromLeft = mouseX - containerRect.left;
            const distanceFromRight = containerRect.right - mouseX;

            const containerParent = e.currentTarget.parentElement;
            const allGroups = Array.from(containerParent.children);
            const currentGroupIndex = allGroups.indexOf(e.currentTarget);
            const isFirstGroup = currentGroupIndex === 0;
            const isLastGroup = currentGroupIndex === allGroups.length - 1;

            // Calculate edge thresholds based on container width
            const containerWidth = containerRect.width;
            const dynamicEdgeThreshold = Math.min(edgeThreshold, containerWidth * 0.2); // 20% of container width or edgeThreshold, whichever is smaller

            // Only show split indicators when NOT over the header
            const newIndicators = {
                leftGroup: !isOverHeader && isFirstGroup && distanceFromLeft < dynamicEdgeThreshold ? groupIndex : null,
                rightGroup: !isOverHeader && isLastGroup && distanceFromRight < dynamicEdgeThreshold ? groupIndex : null,
                betweenGroups: !isOverHeader && !isFirstGroup && distanceFromLeft < dynamicEdgeThreshold ? groupIndex : null,
                betweenGroupsRight: !isOverHeader && !isLastGroup && distanceFromRight < dynamicEdgeThreshold ? groupIndex : null
            };
            
            // Use the debounced version for indicator changes
            debouncedDropIndicatorChange(newIndicators);

            // Only calculate drop index if we're not showing any edge indicators
            if (!Object.values(newIndicators).some(val => val !== null)) {
                // Calculate drop index using originalPositions for smooth animations
                const relativeX = mouseX - headerRect.left;
                let newDropIndex = tabs.length;
                
                if (originalPositions.current.length > 0) {
                    if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
                        newDropIndex = 0;
                    } else {
                        for (let i = 1; i < originalPositions.current.length; i++) {
                            const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                            const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                            
                            if (relativeX >= prevCenter && relativeX < currentCenter) {
                                newDropIndex = i;
                                break;
                            }
                        }
                    }
                }

                // Ensure dropIndex doesn't exceed current group's length
                newDropIndex = Math.min(newDropIndex, tabs.length);
                
                if (dropIndex !== newDropIndex) {
                    setDropIndex(newDropIndex);
                }
            } else {
                // Reset dropIndex when showing edge indicators
                setDropIndex(null);
            }
        }
    };

    const handleDragLeave = (e) => {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const isOutsideContainer = 
            mouseX < containerRect.left ||
            mouseX > containerRect.right ||
            mouseY < containerRect.top ||
            mouseY > containerRect.bottom;
            
        if (isOutsideContainer) {
            onDropIndicatorChange({
                leftGroup: null,
                rightGroup: null,
                betweenGroups: null,
                betweenGroupsRight: null
            });
            if (edgeHoldTimeout.current) {
                clearTimeout(edgeHoldTimeout.current);
                edgeHoldTimeout.current = null;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        debug("tabManagement", "Starting drop operation");
        
        try {
            // Try to get data from dataTransfer first
            const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const sourceGroupIndex = parseInt(e.dataTransfer.getData('groupIndex'));
            let tabInfo = null;
            
            debug("tabManagement", "Initial data from dataTransfer", {
                sourceIndex,
                sourceGroupIndex,
                types: e.dataTransfer.types
            });
            
            try {
                const tabInfoStr = e.dataTransfer.getData('tabInfo');
                tabInfo = JSON.parse(tabInfoStr);
                debug("tabManagement", "Successfully parsed tabInfo from dataTransfer", tabInfo);
            } catch (parseErr) {
                debug("tabManagement", "Failed to parse tabInfo from dataTransfer", parseErr);
            }
            
            // Fallback to global reference if needed
            if (!tabInfo && window.__lastDraggedTab) {
                debug("tabManagement", "Using fallback from global reference", window.__lastDraggedTab);
                tabInfo = window.__lastDraggedTab;
            }
            
            // If we still don't have the required data, abort
            if (isNaN(sourceIndex) || isNaN(sourceGroupIndex) || !tabInfo) {
                debug("tabManagement", "Missing required drag data", {
                    sourceIndex,
                    sourceGroupIndex,
                    tabInfo,
                    globalRef: window.__lastDraggedTab
                });
                return;
            }

            const wasShowingLeftIndicator = dropIndicators.leftGroup === groupIndex;
            const wasShowingRightIndicator = dropIndicators.rightGroup === groupIndex;
            const wasShowingBetweenIndicator = dropIndicators.betweenGroups === groupIndex;
            const wasShowingBetweenIndicatorRight = dropIndicators.betweenGroupsRight === groupIndex;
            
            debug("tabManagement", "Current indicators", {
                wasShowingLeftIndicator,
                wasShowingRightIndicator,
                wasShowingBetweenIndicator,
                wasShowingBetweenIndicatorRight,
                groupIndex,
                sourceGroupIndex
            });
            
            onDropIndicatorChange({
                leftGroup: null,
                rightGroup: null,
                betweenGroups: null,
                betweenGroupsRight: null
            });
            
            if (wasShowingBetweenIndicator) {
                debug("tabManagement", "Splitting tab between groups (left)");
                onTabSplit(tabInfo, sourceGroupIndex, groupIndex);
            }
            else if (wasShowingBetweenIndicatorRight) {
                debug("tabManagement", "Splitting tab between groups (right)");
                onTabSplit(tabInfo, sourceGroupIndex, groupIndex + 1);
            }
            else if (wasShowingLeftIndicator || wasShowingRightIndicator) {
                debug("tabManagement", "Splitting tab to edge", { edge: wasShowingRightIndicator ? 'right' : 'left' });
                onTabSplit(tabInfo, sourceGroupIndex, wasShowingRightIndicator);
            }
            else if (sourceGroupIndex !== groupIndex) {
                debug("tabManagement", "Moving tab between groups");
                const targetIndex = dropIndex !== null ? dropIndex : tabs.length;
                onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
            }
            else if (sourceIndex !== dropIndex && dropIndex !== null) {
                debug("tabManagement", "Reordering within group");
                const newTabs = [...tabs];
                const [movedTab] = newTabs.splice(sourceIndex, 1);
                newTabs.splice(dropIndex, 0, movedTab);
                onTabMove(newTabs, groupIndex);
                if (activeTab === tabs[sourceIndex]) {
                    setActiveTabType(movedTab.type.name);
                }
            }
        } catch (err) {
            debug("tabManagement", "Error handling drop", err);
        }

        setDropIndex(null);
        // Clean up global reference
        delete window.__lastDraggedTab;
    };

    /**
     * Cleans up after drag operation ends
     * Resets all drag-related state
     */
    const handleDragEnd = () => {
        debug("tabManagement", "Ending drag operation");
        setDropIndex(null);
        onDragEnd();
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
        delete window.__draggedTab;
    };

    /**
     * Calculates styles for tabs during drag operations
     * Handles visibility and position transforms
     * 
     * @param {number} index - Index of the tab to style
     * @returns {Object} Style object for the tab
     */
    const getTabStyle = (index) => {
        // Only hide the dragged tab in its original group
        if (draggedTabIndex === null || dropIndex === null || draggedTab === null) return {};
        
        // Get the original positions of tabs in this group
        const currentGroupTabs = originalPositions.current;
        if (!currentGroupTabs || currentGroupTabs.length === 0) return {};
        
        // Only apply visibility:hidden in the source group where the drag started
        if (draggedTab.key && tabs[index]?.key === draggedTab.key) {
            return { visibility: 'hidden' };
        }
        
        const tabElement = tabRefs.current[index];
        if (!tabElement) return {};
        
        const draggedRect = tabRefs.current[draggedTabIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        // Only move tabs if they're in the same group as the dragged tab
        const isDraggedTabInThisGroup = tabs.some(tab => tab.key === draggedTab.key);
        
        if (!isDraggedTabInThisGroup) return {};
        
        if (draggedTabIndex < dropIndex) {
            if (index > draggedTabIndex && index <= dropIndex) {
                return { transform: `translateX(-${tabWidth}px)` };
            }
        } else if (draggedTabIndex > dropIndex) {
            if (index >= dropIndex && index < draggedTabIndex) {
                return { transform: `translateX(${tabWidth}px)` };
            }
        }
        
        return {};
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        debug("tabManagement", "Starting resize operation", { groupIndex });
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = containerRef.current?.getBoundingClientRect().width || 0;

        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const delta = e.clientX - startX;
            onResize(startWidth + delta, groupIndex);
        };

        const handleMouseUp = () => {
            debug("tabManagement", "Ending resize operation", { groupIndex });
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Add additional class names based on the active tab (ex. no-scrollbar for inventory table)
    let additionalClassNames = "";
    switch (activeTabName) {
      case "Tab_Parameters":
        break;
      case "Tab_InventoryTable":
        additionalClassNames = "no-scrollbar";
        break;
      case "Tab_ShopDetails":
        break;
      default:
        additionalClassNames = "";
        break;
    }
    
    return (
        <div 
            ref={containerRef}
            className={`tab-container 
                ${dropIndicators.leftGroup === groupIndex ? 'show-left-indicator' : ''} 
                ${dropIndicators.rightGroup === groupIndex ? 'show-right-indicator' : ''} 
                ${dropIndicators.betweenGroups === groupIndex ? 'show-between-indicator' : ''}
                ${dropIndicators.betweenGroupsRight === groupIndex ? 'show-between-indicator-right' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={containerStyle}
        >
            <div className="tab-header">
                {tabs.map((tab, index) => {
                    if (!tab || !tab.type) {
                        return null;
                    }

                    const tabKey = tab.key || `tab-${tab.type.name || 'unknown'}-${index}`;
                    
                    return (
                        <TabHeader
                            key={tabKey}
                            tab={tab}
                            index={index}
                            isActive={tab === activeTab}
                            isDragging={draggedTab === tab}
                            isDropTarget={dropIndex === index}
                            tabRef={el => tabRefs.current[index] = el}
                            style={getTabStyle(index)}
                            onTabClick={handleTabClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        />
                    );
                })}
            </div>
            <div className={`tab-content ${additionalClassNames}`}>
                {activeTab}
            </div>
            {!isLastGroup && (
                <div 
                    className={`resize-handle ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={handleResizeStart}
                />
            )}
        </div>
    );
}

TabContainer.propTypes = {
    /** Array of tab components to render */
    tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
    /** Callback when tabs are reordered or moved between groups */
    onTabMove: PropTypes.func.isRequired,
    /** Callback when a new group should be created */
    onTabSplit: PropTypes.func.isRequired,
    /** Index of this tab group */
    groupIndex: PropTypes.number.isRequired,
    /** Currently dragged tab */
    draggedTab: PropTypes.node,
    /** Index of currently dragged tab */
    draggedTabIndex: PropTypes.number,
    /** Visual indicators for group splitting */
    dropIndicators: PropTypes.shape({
        leftGroup: PropTypes.number,
        rightGroup: PropTypes.number,
        betweenGroups: PropTypes.number,
        betweenGroupsRight: PropTypes.number
    }).isRequired,
    /** Callback when drag starts */
    onDragStart: PropTypes.func.isRequired,
    /** Callback when drag ends */
    onDragEnd: PropTypes.func.isRequired,
    /** Callback to update drop indicators */
    onDropIndicatorChange: PropTypes.func.isRequired,
    /** Callback when a tab is clicked */
    onTabClick: PropTypes.func,
    onResize: PropTypes.func.isRequired,
    isLastGroup: PropTypes.bool.isRequired,
    /** Style object for the container */
    style: PropTypes.object,
};

export default TabContainer;
