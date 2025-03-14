import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { debug } from '../../../../../utils/debugUtils';
import './TabContainer.css';
import { TAB_CLASS_NAMES } from '../../utils/tabConstants.js';
import useTabDragAndDrop from '../../hooks/useTabDragAndDrop.js';

import TabHeader from './TabHeader.jsx';

/**
 * TabContainer Component
 * Manages a group of draggable tabs with support for:
 * - Drag and drop reordering within the same group
 * - Moving tabs between groups
 * - Creating new groups by dragging to edges
 * - Visual feedback during drag operations
 * - Bidirectional resizing (from left or right edges)
 * 
 * State Management:
 * - activeTab: Currently selected tab in this group
 * - dragState.dropIndex: Current position where a dragged tab would be inserted
 * - tabRefs: References to tab DOM elements for position calculations
 * - originalPositionsRef: Cached positions of tabs when drag starts
 * 
 * Key Behaviors:
 * 1. Drag Start: Caches original positions and sets up drag data
 * 2. Drag Over: Calculates drop positions and shows indicators
 * 3. Drop: Handles tab movement/reordering
 * 4. Drag End: Cleans up state and visual indicators
 * 5. Resize: Supports bidirectional resizing from both edges
 * 
 * Common Issues & Solutions:
 * 1. Tabs jumping during drag: Check originalPositionsRef and getTabStyle
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
    determineDropAction,
    onTabClick,
    onResize,
    isLastGroup,
    isFirstGroup,
    style
}) {
    // Track active tab by type name instead of component reference
    const [activeTabType, setActiveTabType] = useState(tabs[0]?.type?.name);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null); // 'left' or 'right'
    
    const activeTab = tabs.find(tab => tab.type.name === activeTabType) || tabs[0];
    const activeTabName = activeTab?.type?.name;
    const containerRef = useRef(null);
    
    // Refs for DOM manipulation and position tracking
    const tabRefs = useRef({});  // Stores references to tab DOM elements
    const edgeThreshold = 80; // Distance from edge to trigger group split

    // Use the tab drag and drop hook
    const {
        dropIndex,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
        getTabStyle
    } = useTabDragAndDrop({
        tabGroup: tabs,
        groupIndex,
        onTabMove,
        onTabSplit,
        onDragStart,
        onDragEnd,
        onDropIndicatorChange,
        dropIndicators,
        determineDropAction,
        tabRefs,
        edgeThreshold
    });

    // Get the minimum width from the active tab only, not the maximum of all tabs
    const activeTabMinWidth = activeTab?.type?.minWidth || 200;

    // Merge the active tab's minWidth with the provided style
    const containerStyle = {
        ...style,
        minWidth: `${activeTabMinWidth}px`
    };

    // Initialize active tab and notify parent when component mounts
    useEffect(() => {
        if (tabs.length > 0) {
            const initialTab = tabs[0];
            setActiveTabType(initialTab.type.name);
            onTabClick?.(initialTab, 0, groupIndex);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Keep active tab valid when tabs array changes
    useEffect(() => {
        if (!tabs.some(tab => tab.type.name === activeTabType)) {
            const newActiveType = tabs[0]?.type?.name;
            setActiveTabType(newActiveType);
            // Notify parent of active tab change
            if (newActiveType) {
                onTabClick?.(tabs[0], 0, groupIndex);
            }
        }
    }, [tabs, activeTabType, groupIndex, onTabClick]);

    /**
     * Handles tab selection
     * @param {Object} tab - The tab being clicked
     */
    const handleTabClick = (tab) => {
        setActiveTabType(tab.type.name);
        onTabClick?.(tab, tabs.indexOf(tab), groupIndex);
    };

    /**
     * Wrapper for handleDrop to handle active tab updates
     */
    const handleDropWithActiveTabUpdate = (e) => {
        const result = handleDrop(e, draggedTab);
        if (result && result.movedTab && activeTab === tabs[result.sourceIndex]) {
            setActiveTabType(result.movedTab.type.name);
        }
    };

    /**
     * Initiates resize operation from either left or right edge
     * @param {MouseEvent} e - The mouse down event
     * @param {string} direction - The resize direction ('left' or 'right')
     */
    const handleResizeStart = (e, direction) => {
        e.preventDefault();
        debug("tabManagement", "Starting resize operation", { groupIndex, direction });
        setIsResizing(true);
        setResizeDirection(direction);
        
        const startX = e.clientX;
        const startWidth = containerRef.current?.getBoundingClientRect().width || 0;

        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const delta = e.clientX - startX;
            
            // Calculate new width based on direction
            let newWidth;
            if (direction === 'right') {
                // Right resize: add delta to current width
                newWidth = startWidth + delta;
            } else {
                // Left resize: subtract delta from current width
                newWidth = startWidth - delta;
            }
            
            // Call parent resize handler with direction
            onResize(newWidth, groupIndex, direction);
        };

        const handleMouseUp = () => {
            debug("tabManagement", "Ending resize operation", { groupIndex, direction });
            setIsResizing(false);
            setResizeDirection(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Get additional class names from the constants file based on active tab
    const additionalClassNames = activeTabName ? TAB_CLASS_NAMES[activeTabName] || "" : "";
    
    return (
        <div 
            ref={containerRef}
            className={`tab-container 
                ${dropIndicators.leftGroup === groupIndex ? 'show-left-indicator' : ''} 
                ${dropIndicators.rightGroup === groupIndex ? 'show-right-indicator' : ''} 
                ${dropIndicators.betweenGroups === groupIndex ? 'show-between-indicator' : ''}
                ${dropIndicators.betweenGroupsRight === groupIndex ? 'show-between-indicator-right' : ''}
                ${isResizing ? 'resizing' : ''}
                ${resizeDirection ? `resizing-${resizeDirection}` : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropWithActiveTabUpdate}
            style={containerStyle}
        >
            {!isFirstGroup && (
                <div 
                    className={`resize-handle resize-handle-left ${isResizing && resizeDirection === 'left' ? 'resizing' : ''}`}
                    onMouseDown={(e) => handleResizeStart(e, 'left')}
                />
            )}
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
                            style={getTabStyle(index, draggedTab, draggedTabIndex)}
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
                    className={`resize-handle resize-handle-right ${isResizing && resizeDirection === 'right' ? 'resizing' : ''}`}
                    onMouseDown={(e) => handleResizeStart(e, 'right')}
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
    /** Function to determine drop action */
    determineDropAction: PropTypes.func.isRequired,
    /** Callback when a tab is clicked */
    onTabClick: PropTypes.func,
    /** Callback for resize operations */
    onResize: PropTypes.func.isRequired,
    /** Whether this is the last group */
    isLastGroup: PropTypes.bool.isRequired,
    /** Whether this is the first group */
    isFirstGroup: PropTypes.bool,
    /** Style object for the container */
    style: PropTypes.object,
};

TabContainer.defaultProps = {
    isFirstGroup: false
};

export default TabContainer;
