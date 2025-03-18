import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';
import { TAB_CLASS_NAMES } from '../../utils/tabConstants.js';
import useTabDragAndDrop from '../../hooks/useTabDragAndDrop.js';

import TabHeader from './TabHeader.jsx';
import TabDivider from './TabDivider.jsx';

/**
 * TabContainer Component
 * Manages a group of draggable tabs with support for:
 * - Drag and drop reordering within the same group
 * - Moving tabs between groups
 * - Creating new groups by dragging to edges
 * - Visual feedback during drag operations
 * - Bidirectional resizing (using TabDivider component)
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
 * 5. Resize: Supports bidirectional cascading resize via TabDivider
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
    onResizeStart,
    onResizeEnd,
    isLastGroup,
    style,
    isResizing,
    resizeInfo
}) {
    // Track active tab by type name instead of component reference
    const [activeTabType, setActiveTabType] = useState(tabs[0]?.type?.name);
    
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
    
    // Check if this group is involved in cascading resize
    const isCascading = isResizing && 
        resizeInfo?.cascadingGroups?.includes(groupIndex);
    
    // Check if this group has reached minimum width
    const isMinWidthReached = isResizing && 
        resizeInfo?.minWidthReached && 
        (resizeInfo?.dividerIndex === groupIndex || resizeInfo?.dividerIndex === groupIndex - 1);
    
    // Log resize state changes for debugging
    useEffect(() => {
        if (isResizing) {
            console.log(`%c[TabContainer ${groupIndex}] Resizing: ${isResizing}`, 'color: #2196f3');
            
            if (isCascading) {
                console.log(`%c[TabContainer ${groupIndex}] Cascading active`, 'color: #4caf50; font-weight: bold');
            }
            
            if (isMinWidthReached) {
                console.log(`%c[TabContainer ${groupIndex}] Minimum width reached`, 'color: #ff5252; font-weight: bold');
                console.log(`[TabContainer ${groupIndex}] Active tab: ${activeTabName}, Min width: ${activeTabMinWidth}px`);
            }
        }
    }, [groupIndex, isResizing, isCascading, isMinWidthReached, activeTabName, activeTabMinWidth]);

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
                ${isCascading ? 'cascading' : ''}
                ${isMinWidthReached ? 'min-width-reached' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropWithActiveTabUpdate}
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
            
            {/* Right divider (for all groups except the last) */}
            {!isLastGroup && (
                <TabDivider
                    dividerIndex={groupIndex}
                    onResizeStart={onResizeStart}
                    onResize={onResize}
                    onResizeEnd={onResizeEnd}
                    isResizing={isResizing}
                    resizeInfo={resizeInfo}
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
    /** Callback when resize starts */
    onResizeStart: PropTypes.func.isRequired,
    /** Callback when resize ends */
    onResizeEnd: PropTypes.func.isRequired,
    /** Whether a resize operation is in progress */
    isResizing: PropTypes.bool.isRequired,
    /** Information about the current resize operation */
    resizeInfo: PropTypes.object.isRequired,
    /** Whether this is the last group */
    isLastGroup: PropTypes.bool.isRequired,
    /** Style object for the container */
    style: PropTypes.object,
};

export default TabContainer;
