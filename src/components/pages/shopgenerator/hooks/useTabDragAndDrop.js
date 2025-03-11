import { useState, useRef } from 'react';
import { debug } from '../../../../utils/debugUtils';
import useDebounce from '../../../../hooks/useDebounce';

/**
 * Custom hook for managing tab drag and drop functionality
 * 
 * Handles all drag and drop operations for tabs including:
 * - Dragging tabs within the same group
 * - Moving tabs between groups
 * - Creating new tab groups by splitting
 * - Visual feedback during drag operations
 * 
 * @param {Object} params - Hook parameters
 * @param {Array} params.tabs - Array of tab objects in the group
 * @param {number} params.groupIndex - Index of the current tab group
 * @param {Function} params.onTabMove - Callback for tab movement
 * @param {Function} params.onTabSplit - Callback for tab splitting
 * @param {Function} params.onDragStart - Parent drag start handler
 * @param {Function} params.onDragEnd - Parent drag end handler
 * @param {Function} params.onDropIndicatorChange - Callback to update drop indicators
 * @param {Object} params.dropIndicators - Current drop indicators state
 * @param {Object} params.tabRefs - Refs to tab DOM elements
 * @param {number} [params.edgeThreshold=80] - Distance from edge to trigger group split
 * @returns {Object} Drag and drop handlers and state
 */
function useTabDragAndDrop({
  tabs,
  groupIndex,
  onTabMove,
  onTabSplit,
  onDragStart: parentOnDragStart,
  onDragEnd: parentOnDragEnd,
  onDropIndicatorChange,
  dropIndicators,
  tabRefs,
  edgeThreshold = 80
}) {
  // State management
  const [dropIndex, setDropIndex] = useState(null);
  const originalPositions = useRef([]);
  const edgeHoldTimeout = useRef(null);

  // Debounce indicator changes to prevent rapid updates
  const debouncedDropIndicatorChange = useDebounce((indicators) => {
    onDropIndicatorChange(indicators);
  }, 50);

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
    
    parentOnDragStart(tab, index);
    
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
   * Calculates the drop index based on mouse position
   * @param {number} relativeX - Mouse X position relative to header
   * @param {DOMRect} headerRect - Bounding rectangle of the header
   * @returns {number} The calculated drop index
   */
  const calculateDropIndex = (relativeX, headerRect) => {
    let dropIndex = tabs.length;
    
    if (originalPositions.current.length > 0) {
      if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
        dropIndex = 0;
      } else {
        for (let i = 1; i < originalPositions.current.length; i++) {
          const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
          const currentCenter = originalPositions.current[i]?.center - headerRect.left;
          
          if (relativeX >= prevCenter && relativeX < currentCenter) {
            dropIndex = i;
            break;
          }
        }
      }
    }

    // Ensure dropIndex doesn't exceed current group's length
    return Math.min(dropIndex, tabs.length);
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
        let newDropIndex = calculateDropIndex(relativeX, headerRect);
        
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

  /**
   * Determines what action to take based on drop indicators
   * @param {Object} tabInfo - Information about the tab being dropped
   * @param {number} sourceGroupIndex - Index of the group containing the tab
   * @param {Object} indicators - Current drop indicators
   * @returns {Object} Action to take and associated data
   */
  const determineDropAction = (tabInfo, sourceGroupIndex, indicators) => {
    const wasShowingLeftIndicator = indicators.leftGroup === groupIndex;
    const wasShowingRightIndicator = indicators.rightGroup === groupIndex;
    const wasShowingBetweenIndicator = indicators.betweenGroups === groupIndex;
    const wasShowingBetweenIndicatorRight = indicators.betweenGroupsRight === groupIndex;
    
    debug("tabManagement", "Determining drop action", {
      wasShowingLeftIndicator,
      wasShowingRightIndicator,
      wasShowingBetweenIndicator,
      wasShowingBetweenIndicatorRight,
      groupIndex,
      sourceGroupIndex
    });
    
    if (wasShowingBetweenIndicator) {
      return {
        action: 'split',
        targetPosition: groupIndex,
        description: "Splitting tab between groups (left)"
      };
    }
    else if (wasShowingBetweenIndicatorRight) {
      return {
        action: 'split',
        targetPosition: groupIndex + 1,
        description: "Splitting tab between groups (right)"
      };
    }
    else if (wasShowingLeftIndicator || wasShowingRightIndicator) {
      return {
        action: 'split',
        targetPosition: wasShowingRightIndicator, // true for right, false for left
        description: `Splitting tab to ${wasShowingRightIndicator ? 'right' : 'left'} edge`
      };
    }
    else if (sourceGroupIndex !== groupIndex) {
      return {
        action: 'move',
        description: "Moving tab between groups"
      };
    }
    else {
      return {
        action: 'reorder',
        description: "Reordering within group"
      };
    }
  };

  const handleDrop = (e, draggedTab) => {
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

      // Reset drop indicators
      onDropIndicatorChange({
        leftGroup: null,
        rightGroup: null,
        betweenGroups: null,
        betweenGroupsRight: null
      });
      
      // Determine what action to take based on indicators
      const dropAction = determineDropAction(tabInfo, sourceGroupIndex, dropIndicators);
      debug("tabManagement", `Executing drop action: ${dropAction.description}`);
      
      // Execute the appropriate action
      if (dropAction.action === 'split') {
        onTabSplit(tabInfo, sourceGroupIndex, dropAction.targetPosition);
      }
      else if (dropAction.action === 'move') {
        const targetIndex = dropIndex !== null ? dropIndex : tabs.length;
        onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
      }
      else if (dropAction.action === 'reorder' && sourceIndex !== dropIndex && dropIndex !== null) {
        const newTabs = [...tabs];
        const [movedTab] = newTabs.splice(sourceIndex, 1);
        newTabs.splice(dropIndex, 0, movedTab);
        onTabMove(newTabs, groupIndex);
        
        // Return the moved tab for the component to handle active tab updates
        return { movedTab, sourceIndex };
      }
    } catch (err) {
      debug("tabManagement", "Error handling drop", err);
    }

    setDropIndex(null);
    // Clean up global reference
    delete window.__lastDraggedTab;
    
    return null;
  };

  /**
   * Cleans up after drag operation ends
   * Resets all drag-related state
   */
  const handleDragEnd = () => {
    debug("tabManagement", "Ending drag operation");
    setDropIndex(null);
    parentOnDragEnd();
    if (edgeHoldTimeout.current) {
      clearTimeout(edgeHoldTimeout.current);
      edgeHoldTimeout.current = null;
    }
    delete window.__draggedTab;
  };

  /**
   * Checks if the tab at the given index is the one being dragged
   * @param {number} index - Index of the tab to check
   * @param {Object} draggedTab - The tab being dragged
   * @returns {boolean} True if this is the dragged tab
   */
  const isDraggedTab = (index, draggedTab) => {
    return draggedTab?.key && tabs[index]?.key === draggedTab.key;
  };

  /**
   * Checks if the given tab is in the current group
   * @param {Object} tab - The tab to check
   * @returns {boolean} True if the tab is in this group
   */
  const isTabInCurrentGroup = (tab) => {
    return tabs.some(t => t.key === tab?.key);
  };

  /**
   * Calculates the transform style for a tab during drag
   * @param {number} index - Index of the tab
   * @param {number} draggedTabIndex - Index of the dragged tab
   * @returns {Object} Style object with transform property
   */
  const calculateTabTransform = (index, draggedTabIndex) => {
    const draggedRect = tabRefs.current[draggedTabIndex]?.getBoundingClientRect();
    const tabWidth = draggedRect ? draggedRect.width : 0;
    
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

  /**
   * Calculates styles for tabs during drag operations
   * Handles visibility and position transforms
   * 
   * @param {number} index - Index of the tab to style
   * @param {Object} draggedTab - The tab being dragged
   * @param {number} draggedTabIndex - Index of the dragged tab
   * @returns {Object} Style object for the tab
   */
  const getTabStyle = (index, draggedTab, draggedTabIndex) => {
    // If we're not in a valid drag operation, return empty styles
    if (draggedTabIndex === null || dropIndex === null || draggedTab === null) return {};
    
    // Get the original positions of tabs in this group
    const currentGroupTabs = originalPositions.current;
    if (!currentGroupTabs || currentGroupTabs.length === 0) return {};
    
    // Check if this tab is the one being dragged
    if (isDraggedTab(index, draggedTab)) {
      return { visibility: 'hidden' };
    }
    
    // Check if we have a valid tab element reference
    const tabElement = tabRefs.current[index];
    if (!tabElement) return {};
    
    // Only apply transforms if the dragged tab is in this group
    if (!isTabInCurrentGroup(draggedTab)) return {};
    
    // Calculate transform for tab position adjustment
    return calculateTabTransform(index, draggedTabIndex);
  };

  return {
    dropIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getTabStyle
  };
}

export default useTabDragAndDrop; 