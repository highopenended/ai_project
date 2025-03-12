import { useState, useRef } from 'react';
import { debug } from '../../../../utils/debugUtils';

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
 * @param {Array} params.tabGroup - Array of tab objects in the group
 * @param {number} params.groupIndex - Index of the current tab group
 * @param {Function} params.onTabMove - Callback for tab movement
 * @param {Function} params.onTabSplit - Callback for tab splitting
 * @param {Function} params.onDragStart - Parent drag start handler
 * @param {Function} params.onDragEnd - Parent drag end handler
 * @param {Function} params.onDropIndicatorChange - Callback to update drop indicators
 * @param {Object} params.dropIndicators - Current drop indicators state
 * @param {Function} params.determineDropAction - Function to determine drop action
 * @param {Object} params.tabRefs - Refs to tab DOM elements
 * @param {number} [params.edgeThreshold=80] - Distance from edge to trigger group split
 * @returns {Object} Drag and drop handlers and state
 */
function useTabDragAndDrop({
  tabGroup,
  groupIndex,
  onTabMove,
  onTabSplit,
  onDragStart,
  onDragEnd,
  onDropIndicatorChange,
  dropIndicators,
  determineDropAction,
  tabRefs,
  edgeThreshold = 80
}) {
  // Consolidated state management
  const [dragState, setDragState] = useState({
    dropIndex: null,
    lastUpdateTime: 0
  });
  
  const originalPositionsRef = useRef([]);
  const edgeHoldTimeoutRef = useRef(null);

  /**
   * Updates drag state with batched changes
   * @param {Object} updates - State updates to apply
   */
  const handleDragStateUpdate = (updates) => {
    setDragState(prev => ({ ...prev, ...updates }));
    debug("tabManagement", "Updating drag state", updates);
  };

  /**
   * Resets drag state properties
   */
  const handleDragStateReset = () => {
    handleDragStateUpdate({
      dropIndex: null,
      lastUpdateTime: Date.now()
    });
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
    originalPositionsRef.current = tabElements.map(tab => {
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
   * Calculates the drop index based on mouse position
   * @param {number} relativeX - Mouse X position relative to header
   * @param {DOMRect} headerRect - Bounding rectangle of the header
   * @returns {number} The calculated drop index
   */
  const calculateDropIndex = (relativeX, headerRect) => {
    let newDropIndex = tabGroup.length;
    
    if (originalPositionsRef.current.length > 0) {
      if (relativeX < originalPositionsRef.current[0]?.center - headerRect.left) {
        newDropIndex = 0;
      } else {
        for (let i = 1; i < originalPositionsRef.current.length; i++) {
          const prevCenter = originalPositionsRef.current[i - 1]?.center - headerRect.left;
          const currentCenter = originalPositionsRef.current[i]?.center - headerRect.left;
          
          if (relativeX >= prevCenter && relativeX < currentCenter) {
            newDropIndex = i;
            break;
          }
        }
      }
    }

    // Ensure dropIndex doesn't exceed current group's length
    return Math.min(newDropIndex, tabGroup.length);
  };

  /**
   * Handles drag over events
   * Calculates drop positions and updates indicators
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
    
    // Determine if this is the first or last group
    const container = e.currentTarget;
    const parent = container.parentElement;
    const isFirstGroup = parent.children[0] === container;
    const isLastGroup = parent.children[parent.children.length - 1] === container;
    
    // Call the parent's onDropIndicatorChange with all the parameters needed
    onDropIndicatorChange(
      mouseX,
      mouseY,
      containerRect,
      headerRect,
      groupIndex,
      edgeThreshold,
      isFirstGroup,
      isLastGroup
    );

    // Only calculate drop index if we're not showing any edge indicators
    if (!Object.values(dropIndicators).some(val => val !== null)) {
      // Calculate drop index using originalPositions for smooth animations
      const relativeX = mouseX - headerRect.left;
      let newDropIndex = calculateDropIndex(relativeX, headerRect);
      
      if (dragState.dropIndex !== newDropIndex) {
        handleDragStateUpdate({
          dropIndex: newDropIndex
        });
      }
    } else {
      // Reset dropIndex when showing edge indicators
      handleDragStateUpdate({
        dropIndex: null
      });
    }
  };

  /**
   * Handles drag leave events
   * Hides indicators when mouse leaves the container
   */
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
      // Call with empty parameters to hide indicators
      onDropIndicatorChange(0, 0, null, null, null, 0, false, false);
      
      if (edgeHoldTimeoutRef.current) {
        clearTimeout(edgeHoldTimeoutRef.current);
        edgeHoldTimeoutRef.current = null;
      }
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
      onDropIndicatorChange({});
      
      // Determine what action to take based on indicators
      const dropAction = determineDropAction({ 
        groupIndex, 
        sourceGroupIndex 
      });
      
      debug("tabManagement", `Executing drop action: ${dropAction.description}`);
      
      // Execute the appropriate action
      if (dropAction.action === 'split') {
        onTabSplit(tabInfo, sourceGroupIndex, dropAction.targetPosition);
      }
      else if (dropAction.action === 'move') {
        const targetIndex = dragState.dropIndex !== null ? dragState.dropIndex : tabGroup.length;
        onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
      }
      else if (dropAction.action === 'reorder' && sourceIndex !== dragState.dropIndex && dragState.dropIndex !== null) {
        const newTabs = [...tabGroup];
        const [movedTab] = newTabs.splice(sourceIndex, 1);
        newTabs.splice(dragState.dropIndex, 0, movedTab);
        onTabMove(newTabs, groupIndex);
        
        // Return the moved tab for the component to handle active tab updates
        return { movedTab, sourceIndex };
      }
    } catch (err) {
      debug("tabManagement", "Error handling drop", err);
    }

    handleDragStateReset();
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
    handleDragStateReset();
    onDragEnd();
    if (edgeHoldTimeoutRef.current) {
      clearTimeout(edgeHoldTimeoutRef.current);
      edgeHoldTimeoutRef.current = null;
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
    return draggedTab?.key && tabGroup[index]?.key === draggedTab.key;
  };

  /**
   * Checks if the given tab is in the current group
   * @param {Object} tab - The tab to check
   * @returns {boolean} True if the tab is in this group
   */
  const isTabInCurrentGroup = (tab) => {
    return tabGroup.some(t => t.key === tab?.key);
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
    
    if (draggedTabIndex < dragState.dropIndex) {
      if (index > draggedTabIndex && index <= dragState.dropIndex) {
        return { transform: `translateX(-${tabWidth}px)` };
      }
    } else if (draggedTabIndex > dragState.dropIndex) {
      if (index >= dragState.dropIndex && index < draggedTabIndex) {
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
    if (draggedTabIndex === null || dragState.dropIndex === null || draggedTab === null) return {};
    
    // Get the original positions of tabs in this group
    const currentGroupTabs = originalPositionsRef.current;
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
    dropIndex: dragState.dropIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getTabStyle
  };
}

export default useTabDragAndDrop; 