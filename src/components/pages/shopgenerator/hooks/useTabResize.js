import { useState, useRef, useCallback, useEffect } from "react";
import { debug, trackPerformance, createMark } from '../../../../utils/debugUtils';
import { TAB_PRIORITIES } from '../utils/tabConstants';

// Constants
const RESIZE_THROTTLE_MS = 16; // ~60fps
const DEFAULT_PRIORITY = 0; // Default priority if not found

/**
 * Custom hook for managing tab group resizing with cascading functionality
 * 
 * Handles the resizing of tab groups with:
 * - Cascading resize when adjacent groups reach minimum width
 * - Minimum width constraints based on active tabs
 * - Performance throttling
 * - Percentage-based width calculations
 * - Global mouse event handling
 * - Priority-based resizing when tab groups change
 * - Bidirectional resizing support
 * 
 * @param {Object} params - Hook parameters
 * @param {Array<string>} params.initialGroupWidths - Initial widths for tab groups
 * @param {number} params.tabGroupsLength - Number of tab groups
 * @param {Array<Array<Object>>} [params.tabGroups] - Current tab groups configuration
 * @param {Object} [params.activeTabTypes] - Map of active tab types for each group
 * @returns {Object} Resize handlers and state
 */
function useTabResize({ initialGroupWidths, tabGroupsLength, tabGroups, activeTabTypes }) {
  // State for group widths
  const [flexBasis, setFlexBasis] = useState(initialGroupWidths);
  const [isResizing, setIsResizing] = useState(false);
  const lastResizeTimeRef = useRef(0);
  const previousGroupsLengthRef = useRef(tabGroupsLength);
  const previousWidthsRef = useRef(initialGroupWidths);
  
  // Resize tracking ref
  const resizeRef = useRef({ 
    active: false,
    dividerIndex: null,
    startX: null,
    startWidths: [],
    cascadingGroups: [],
    minWidthReached: false
  });

  /**
   * Gets the container width for resize calculations
   * @returns {number} Width of the container in pixels
   */
  const getContainerWidth = useCallback(() => {
    const container = document.querySelector(".shop-generator");
    return container ? container.clientWidth : 0;
  }, []);

  /**
   * Gets the minimum width for a tab group based on its active tab
   * @param {number} groupIndex - Index of the group
   * @returns {number} Minimum width in pixels
   */
  const getGroupMinWidth = useCallback((groupIndex) => {
    if (!tabGroups || !tabGroups[groupIndex]) {
      debug("tabManagement", "No tab group found for index", { groupIndex });
      return 200; // Default minimum width
    }

    // Get the active tab type for this group
    const activeTabType = activeTabTypes?.[groupIndex];
    debug("tabManagement", "Getting min width for group", { 
      groupIndex, 
      activeTabType,
      availableTypes: tabGroups[groupIndex].map(tab => tab.type.name),
      activeTabsState: activeTabTypes
    });
    
    if (!activeTabType) {
      // If no active tab is found, use the first tab in the group
      const firstTab = tabGroups[groupIndex][0];
      const minWidth = firstTab?.type?.minWidth || 200;
      debug("tabManagement", "Using first tab min width", { minWidth });
      return minWidth;
    }

    // Find the active tab and get its minWidth
    const activeTab = tabGroups[groupIndex].find(tab => tab.type.name === activeTabType);
    const minWidth = activeTab?.type?.minWidth || 200;
    debug("tabManagement", "Using active tab min width", { 
      activeTabName: activeTab?.type?.name,
      minWidth 
    });
    return minWidth;
  }, [tabGroups, activeTabTypes]);

  /**
   * Gets the priority for a tab group based on its active tab
   * @param {number} groupIndex - Index of the group
   * @returns {number} Priority value (higher = more important)
   */
  const getGroupPriority = useCallback((groupIndex) => {
    if (!tabGroups || !tabGroups[groupIndex]) {
      return DEFAULT_PRIORITY;
    }

    // Get the active tab type for this group
    const activeTabType = activeTabTypes?.[groupIndex];
    
    if (!activeTabType) {
      // If no active tab is found, use the first tab in the group
      const firstTab = tabGroups[groupIndex][0];
      return TAB_PRIORITIES[firstTab?.type?.name] || DEFAULT_PRIORITY;
    }

    // Return the priority for the active tab type
    return TAB_PRIORITIES[activeTabType] || DEFAULT_PRIORITY;
  }, [tabGroups, activeTabTypes]);

  /**
   * Converts percentage widths to pixel values
   * @param {Array<string>} percentWidths - Array of percentage strings (e.g. ['10%', '20%'])
   * @param {number} totalWidth - Total width in pixels
   * @returns {Array<number>} Array of pixel widths
   */
  const percentToPixels = useCallback((percentWidths, totalWidth) => {
    return percentWidths.map(width => {
      const percent = parseFloat(width);
      return (percent / 100) * totalWidth;
    });
  }, []);

  /**
   * Converts pixel widths to percentage values
   * @param {Array<number>} pixelWidths - Array of pixel widths
   * @param {number} totalWidth - Total width in pixels
   * @returns {Array<number>} Array of percentage values (not strings)
   */
  const pixelsToPercent = useCallback((pixelWidths, totalWidth) => {
    return pixelWidths.map(width => (width / totalWidth) * 100);
  }, []);

  /**
   * Normalizes percentage widths to ensure they sum to 100%
   * @param {Array<number>} percentWidths - Array of percentage values
   * @returns {Array<number>} Normalized percentage values
   */
  const normalizeWidths = useCallback((percentWidths) => {
    const sum = percentWidths.reduce((acc, width) => acc + width, 0);
    if (Math.abs(sum - 100) < 0.01) return percentWidths;
    
    return percentWidths.map(width => (width / sum) * 100);
  }, []);

  /**
   * Enforces minimum widths for all groups
   * @param {Array<number>} widthsInPixels - Current widths in pixels
   * @param {number} containerWidth - Total container width in pixels
   * @returns {Array<number>} Adjusted widths in pixels
   */
  const enforceMinimumWidths = useCallback((widthsInPixels, containerWidth) => {
    const minWidths = Array(widthsInPixels.length).fill(0)
      .map((_, index) => getGroupMinWidth(index));
    
    // Get priorities for all groups
    const priorities = Array(widthsInPixels.length).fill(0)
      .map((_, index) => getGroupPriority(index));
    
    debug("tabManagement", "Enforcing minimum widths", { 
      widthsInPixels, 
      minWidths,
      priorities
    });
    
    // First pass: identify groups below minimum width
    let adjustedWidths = [...widthsInPixels];
    let needsAdjustment = false;
    
    for (let i = 0; i < adjustedWidths.length; i++) {
      if (adjustedWidths[i] < minWidths[i]) {
        needsAdjustment = true;
        break;
      }
    }
    
    if (!needsAdjustment) {
      return adjustedWidths;
    }
    
    // Second pass: adjust widths based on priorities
    // Sort groups by priority (lowest first)
    const groupIndices = Array(adjustedWidths.length).fill(0)
      .map((_, index) => index)
      .sort((a, b) => priorities[a] - priorities[b]);
    
    // Ensure all groups meet minimum width requirements
    for (let i = 0; i < adjustedWidths.length; i++) {
      const index = groupIndices[i];
      
      if (adjustedWidths[index] < minWidths[index]) {
        const deficit = minWidths[index] - adjustedWidths[index];
        adjustedWidths[index] = minWidths[index];
        
        // Distribute the deficit among higher priority groups
        let remainingDeficit = deficit;
        
        // Start from the highest priority groups
        for (let j = adjustedWidths.length - 1; j > i; j--) {
          const highPriorityIndex = groupIndices[j];
          const available = Math.max(0, adjustedWidths[highPriorityIndex] - minWidths[highPriorityIndex]);
          
          if (available > 0) {
            const reduction = Math.min(available, remainingDeficit);
            adjustedWidths[highPriorityIndex] -= reduction;
            remainingDeficit -= reduction;
            
            if (remainingDeficit <= 0) break;
          }
        }
      }
    }
    
    // Ensure total width is maintained
    const totalWidth = adjustedWidths.reduce((sum, width) => sum + width, 0);
    if (Math.abs(totalWidth - containerWidth) > 0.1) {
      const scaleFactor = containerWidth / totalWidth;
      adjustedWidths = adjustedWidths.map(width => width * scaleFactor);
    }
    
    return adjustedWidths;
  }, [getGroupMinWidth, getGroupPriority]);

  /**
   * Initializes resize operation
   * @param {number} dividerIndex - Index of the divider being dragged
   */
  const handleResizeStart = useCallback((dividerIndex) => {
    // Validate inputs
    if (dividerIndex < 0 || dividerIndex >= tabGroupsLength - 1) {
      debug("tabManagement", "Invalid divider index", { dividerIndex });
      return;
    }
    
    console.log(`%c[ResizeStart] Divider ${dividerIndex} - Starting resize operation`, 'color: #9c27b0; font-weight: bold');
    
    // Get container width
    const totalWidth = getContainerWidth();
    if (!totalWidth) {
      debug("tabManagement", "No container width available");
      return;
    }
    
    // Convert current widths to pixels
    const pixelWidths = percentToPixels(flexBasis, totalWidth);
    
    console.log(`[ResizeStart] Initial widths (px): [${pixelWidths.join(', ')}]`);
    console.log(`[ResizeStart] Initial percentages: [${flexBasis.join(', ')}]`);
    
    // Get minimum widths for all groups
    const minWidths = Array(pixelWidths.length).fill(0)
      .map((_, index) => getGroupMinWidth(index));
    
    console.log(`[ResizeStart] Minimum widths (px): [${minWidths.join(', ')}]`);
    
    // Update resize state
    resizeRef.current = {
      isResizing: true,
      dividerIndex,
      startWidths: pixelWidths,
      minWidths,
      cascadingGroups: [],
      minWidthReached: false
    };
    
    // Update UI state
    setIsResizing(true);
    
    // Update last resize time
    lastResizeTimeRef.current = Date.now();
  }, [tabGroupsLength, getContainerWidth, percentToPixels, flexBasis, getGroupMinWidth]);

  /**
   * Performs cascading resize operation
   * @param {number} dividerIndex - Index of the divider being dragged
   * @param {number} delta - Mouse movement delta in pixels
   */
  const handleResize = useCallback((dividerIndex, delta) => {
    const startMark = createMark('tabManagement', 'Resize Operation');

    // Apply throttling
    const now = Date.now();
    if (now - lastResizeTimeRef.current < RESIZE_THROTTLE_MS) {
      return;
    }

    // Validate inputs
    if (dividerIndex < 0 || dividerIndex >= tabGroupsLength - 1) {
      debug("tabManagement", "Invalid divider index", { dividerIndex });
      return;
    }

    console.log(`%c[Resize] Divider ${dividerIndex}, Delta: ${delta}px`, 'color: #4caf50; font-weight: bold');

    // Get container width
    const totalWidth = getContainerWidth();
    if (!totalWidth) {
      debug("tabManagement", "No container width available");
      return;
    }

    // Update resize state
    lastResizeTimeRef.current = now;

    // Calculate and apply new widths
    setFlexBasis(prev => {
      // Convert to pixels for easier calculations
      const pixelWidths = percentToPixels(prev, totalWidth);
      
      // Get the initial widths from resize start
      const startWidths = resizeRef.current.startWidths.length > 0 
        ? resizeRef.current.startWidths 
        : [...pixelWidths];
      
      // Create a new array for the updated widths
      const newPixelWidths = [...pixelWidths];
      
      // Get minimum widths for all groups
      const minWidths = Array(pixelWidths.length).fill(0)
        .map((_, index) => getGroupMinWidth(index));
      
      // Implement cascading resize logic
      const leftGroupIndex = dividerIndex;
      const rightGroupIndex = dividerIndex + 1;
      
      console.log(`%c[Resize] Groups: Left=${leftGroupIndex}, Right=${rightGroupIndex}`, 'color: #2196f3');
      console.log(`[Resize] Start Widths: Left=${startWidths[leftGroupIndex]}px, Right=${startWidths[rightGroupIndex]}px`);
      console.log(`[Resize] Min Widths: Left=${minWidths[leftGroupIndex]}px, Right=${minWidths[rightGroupIndex]}px`);
      
      // Calculate new widths based on delta
      let leftWidth = startWidths[leftGroupIndex] + delta;
      let rightWidth = startWidths[rightGroupIndex] - delta;
      
      console.log(`[Resize] Calculated Widths: Left=${leftWidth}px, Right=${rightWidth}px`);
      
      // Check if either group has reached its minimum width
      const leftMinReached = leftWidth <= minWidths[leftGroupIndex];
      const rightMinReached = rightWidth <= minWidths[rightGroupIndex];
      
      console.log(`%c[Resize] Min Width Reached: Left=${leftMinReached}, Right=${rightMinReached}`, 
        leftMinReached || rightMinReached ? 'color: #ff5252; font-weight: bold' : 'color: #2196f3');
      
      // Track which groups are involved in cascading
      let cascadingGroups = [];
      let minWidthReached = false;
      
      // Determine the resize direction based on delta
      // delta > 0: Dragging right (expanding left group, shrinking right group)
      // delta < 0: Dragging left (shrinking left group, expanding right group)
      
      if (delta > 0) {
        // Dragging right (expanding left group, shrinking right group)
        console.log(`%c[Resize] Direction: RIGHT (expanding left group)`, 'color: #4caf50');
        
        if (rightMinReached) {
          // Right group reached minimum, cascade to next groups
          // This is the case where we're expanding the left group and need to cascade
          minWidthReached = true;
          console.log(`%c[Resize] Right group reached minimum width, cascading...`, 'color: #ff9800; font-weight: bold');
          
          // Set right group to its minimum
          rightWidth = minWidths[rightGroupIndex];
          
          // Calculate remaining delta to distribute
          let remainingDelta = startWidths[rightGroupIndex] - minWidths[rightGroupIndex];
          let currentDelta = delta - remainingDelta;
          
          console.log(`[Resize] Remaining delta to distribute: ${currentDelta}px`);
          
          // Try to cascade to groups to the right
          for (let i = rightGroupIndex + 1; i < pixelWidths.length; i++) {
            cascadingGroups.push(i);
            
            const groupMinWidth = minWidths[i];
            const availableWidth = startWidths[i] - groupMinWidth;
            
            console.log(`[Resize] Cascading to group ${i}: Min=${groupMinWidth}px, Available=${availableWidth}px`);
            
            if (availableWidth > 0) {
              // This group can absorb some of the delta
              const absorbedDelta = Math.min(availableWidth, currentDelta);
              newPixelWidths[i] = startWidths[i] - absorbedDelta;
              currentDelta -= absorbedDelta;
              
              console.log(`[Resize] Group ${i} absorbed ${absorbedDelta}px, remaining delta: ${currentDelta}px`);
              
              if (currentDelta <= 0) {
                console.log(`[Resize] All delta absorbed, stopping cascade`);
                break;
              }
      } else {
              console.log(`[Resize] Group ${i} cannot absorb any delta (at min width)`);
            }
          }
          
          // Adjust left group width based on what was actually absorbed
          leftWidth = startWidths[leftGroupIndex] + (delta - currentDelta);
          console.log(`[Resize] Adjusted left group width: ${leftWidth}px (absorbed ${delta - currentDelta}px)`);
        }
      } else if (delta < 0) {
        // Dragging left (shrinking left group, expanding right group)
        console.log(`%c[Resize] Direction: LEFT (shrinking left group)`, 'color: #2196f3');
        
        // In this case, we don't want to cascade when the left group reaches minimum width
        // Instead, we just stop the resize operation at the minimum width
        if (leftMinReached) {
          // Left group reached minimum, don't cascade, just stop at minimum width
          minWidthReached = true;
          console.log(`%c[Resize] Left group reached minimum width, stopping resize`, 'color: #ff5252; font-weight: bold');
          
          leftWidth = minWidths[leftGroupIndex];
          
          // Calculate how much of the delta we could actually apply
          const appliedDelta = startWidths[leftGroupIndex] - minWidths[leftGroupIndex];
          
          console.log(`[Resize] Applied delta: ${appliedDelta}px of requested ${delta}px`);
          
          // Adjust right group width based on what was actually applied
          rightWidth = startWidths[rightGroupIndex] - (delta + appliedDelta);
          console.log(`[Resize] Adjusted right group width: ${rightWidth}px`);
        }
      }
      
      // Update the widths of the primary groups
      newPixelWidths[leftGroupIndex] = Math.max(leftWidth, minWidths[leftGroupIndex]);
      newPixelWidths[rightGroupIndex] = Math.max(rightWidth, minWidths[rightGroupIndex]);
      
      console.log(`[Resize] Final widths: Left=${newPixelWidths[leftGroupIndex]}px, Right=${newPixelWidths[rightGroupIndex]}px`);
      
      // Store cascading information for visual feedback
      resizeRef.current.cascadingGroups = cascadingGroups;
      resizeRef.current.minWidthReached = minWidthReached;
      
      if (cascadingGroups.length > 0) {
        console.log(`%c[Resize] Cascading to groups: ${cascadingGroups.join(', ')}`, 'color: #ff9800; font-weight: bold');
      }
      
      // Enforce minimum widths for all groups
      const adjustedPixelWidths = enforceMinimumWidths(newPixelWidths, totalWidth);
      
      // Convert back to percentages
      const newPercentWidths = pixelsToPercent(adjustedPixelWidths, totalWidth);
      
      // Normalize to ensure sum is 100%
      const normalizedWidths = normalizeWidths(newPercentWidths);
      
      // Convert to percentage strings
      const newBasis = normalizedWidths.map(w => `${w}%`);
      
      console.log(`[Resize] New basis percentages: [${newBasis.join(', ')}]`);
      console.log('-----------------------------------');

      trackPerformance('tabManagement', 'Resize Operation', startMark);
      return newBasis;
    });
  }, [
    tabGroupsLength, 
    getContainerWidth, 
    percentToPixels, 
    pixelsToPercent, 
    normalizeWidths, 
    enforceMinimumWidths,
    getGroupMinWidth
  ]);

  /**
   * Ends resize operation
   */
  const handleResizeEnd = useCallback(() => {
    console.log(`%c[ResizeEnd] Ending resize operation`, 'color: #9c27b0; font-weight: bold');
    
    if (resizeRef.current.isResizing) {
      // Get final state information
      const { dividerIndex, cascadingGroups, minWidthReached } = resizeRef.current;
      
      console.log(`[ResizeEnd] Divider: ${dividerIndex}`);
      console.log(`[ResizeEnd] Final percentages: [${flexBasis.join(', ')}]`);
      
      if (cascadingGroups.length > 0) {
        console.log(`[ResizeEnd] Cascaded to groups: [${cascadingGroups.join(', ')}]`);
      }
      
      if (minWidthReached) {
        console.log(`[ResizeEnd] Minimum width was reached during resize`);
      }
      
      // Reset resize state
      resizeRef.current = {
        isResizing: false,
        dividerIndex: null,
        startWidths: [],
        minWidths: [],
        cascadingGroups: [],
        minWidthReached: false
      };
    }
    
    // Update UI state
    setIsResizing(false);
    
    console.log('===================================');
  }, [flexBasis]);

  /**
   * Sets up global mouse event handlers for resize operations
   */
  useEffect(() => {
    const currentRef = resizeRef.current;

    // Handle mouse up globally to end resize operations
    const handleGlobalMouseUp = () => {
      if (!currentRef.active) return;

      debug("tabManagement", "Global mouse up detected");
      handleResizeEnd();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleResizeEnd]);

  /**
   * Tracks resize state changes
   */
  useEffect(() => {
    resizeRef.current.active = isResizing;
  }, [isResizing]);

  /**
   * Redistributes widths when adding new tab groups
   * @param {Array<string>} previousWidths - Previous width percentages
   * @param {number} newLength - New number of groups
   * @param {Array<Object>} groupPriorities - Priority information for each group
   * @returns {Array<string>} New width percentages
   */
  const redistributeForNewGroups = (previousWidths, newLength, groupPriorities) => {
    // Convert percentage strings to numbers
    const prevPercentages = previousWidths.map(w => parseFloat(w));
    
    // Calculate how much width we need to allocate for new groups
    const newGroupCount = newLength - previousWidths.length;
    const newGroupPercentage = 10; // Default percentage for new groups
    const totalNewGroupPercentage = newGroupPercentage * newGroupCount;
    
    // Sort groups by priority (lowest first)
    groupPriorities.sort((a, b) => a.priority - b.priority);
    
    // Calculate how much to take from each existing group
    let remainingToTake = totalNewGroupPercentage;
    const newPercentages = [...prevPercentages];
    
    // Take from lowest priority groups first
    for (const group of groupPriorities) {
      if (remainingToTake <= 0) break;
      
      const index = group.index;
      if (index >= newPercentages.length) continue;
      
      // Calculate how much we can take from this group
      const currentWidth = newPercentages[index];
      const minWidthPercent = (group.minWidth / getContainerWidth()) * 100;
      const availableToTake = Math.max(0, currentWidth - minWidthPercent);
      
      if (availableToTake > 0) {
        const amountToTake = Math.min(availableToTake, remainingToTake);
        newPercentages[index] = currentWidth - amountToTake;
        remainingToTake -= amountToTake;
      }
    }
    
    // If we couldn't take enough, adjust all groups proportionally
    if (remainingToTake > 0) {
      const scaleFactor = (100 - totalNewGroupPercentage) / 100;
      for (let i = 0; i < newPercentages.length; i++) {
        newPercentages[i] *= scaleFactor;
      }
    }
    
    // Add new groups with the allocated percentage
    const adjustedNewGroupPercentage = (totalNewGroupPercentage - remainingToTake) / newGroupCount;
    const result = [
      ...newPercentages,
      ...Array(newGroupCount).fill(adjustedNewGroupPercentage)
    ];
    
    // Normalize to ensure sum is 100%
    const sum = result.reduce((acc, val) => acc + val, 0);
    const normalized = result.map(val => (val / sum) * 100);
    
    // Convert back to percentage strings
    return normalized.map(p => `${p}%`);
  };

  /**
   * Redistributes widths when removing tab groups
   * @param {Array<string>} previousWidths - Previous width percentages
   * @param {number} previousLength - Previous number of groups
   * @param {number} newLength - New number of groups
   * @returns {Array<string>} New width percentages
   */
  const redistributeAfterRemoval = (previousWidths, previousLength, newLength) => {
    // If we have exactly the right number of widths, just return them
    if (previousWidths.length === newLength) {
      return previousWidths;
    }
    
    // If we have too many widths, truncate
    if (previousWidths.length > newLength) {
      const truncated = previousWidths.slice(0, newLength);
      
      // Normalize to ensure sum is 100%
      const sum = truncated.reduce((acc, val) => acc + parseFloat(val), 0);
      const normalized = truncated.map(val => (parseFloat(val) / sum) * 100);
      
      // Convert back to percentage strings
      return normalized.map(p => `${p}%`);
    }
    
    // If we have too few widths, add new ones with equal distribution
    const missingCount = newLength - previousWidths.length;
    const equalPercentage = 100 / newLength;
    
    return [
      ...previousWidths,
      ...Array(missingCount).fill(`${equalPercentage}%`)
    ];
  };

  /**
   * Redistributes widths based on tab priorities when group count changes
   * Preserves widths of high-priority groups and adjusts low-priority groups
   */
  useEffect(() => {
    // Early return if no change needed
    if (tabGroupsLength === previousGroupsLengthRef.current && 
        tabGroupsLength === flexBasis.length) {
      return;
    }

    debug("tabManagement", "Tab groups changed", { 
      previous: previousGroupsLengthRef.current, 
      current: tabGroupsLength 
    });

    // Store current widths for reference
    const previousWidths = [...previousWidthsRef.current];
    const previousLength = previousGroupsLengthRef.current;
    
    // If this is the first render or we have no previous widths, use equal distribution
    if (previousLength === 0 || previousWidths.length === 0) {
      debug("tabManagement", "No previous widths, using equal distribution");
      const defaultWidths = Array(tabGroupsLength).fill(`${100 / tabGroupsLength}%`);
      setFlexBasis(defaultWidths);
      previousGroupsLengthRef.current = tabGroupsLength;
      previousWidthsRef.current = defaultWidths;
      return;
    }

    // Calculate priorities for all groups
    const groupPriorities = Array(tabGroupsLength).fill(0)
      .map((_, index) => ({
        index,
        priority: getGroupPriority(index),
        // Convert percentage string to number
        width: index < flexBasis.length 
          ? parseFloat(flexBasis[index]) 
          : 0,
        minWidth: getGroupMinWidth(index)
      }));

    // Sort groups by priority (lowest first)
    groupPriorities.sort((a, b) => a.priority - b.priority);
    
    debug("tabManagement", "Group priorities", groupPriorities);

    // Determine if we're adding or removing groups
    const isAdding = tabGroupsLength > previousLength;
    const isDifferent = tabGroupsLength !== previousLength;
    
    let newBasis;

    if (isDifferent) {
      if (isAdding) {
        // Adding new groups
        newBasis = redistributeForNewGroups(previousWidths, tabGroupsLength, groupPriorities);
      } else {
        // Removing groups
        newBasis = redistributeAfterRemoval(previousWidths, previousLength, tabGroupsLength);
      }
      
      debug("tabManagement", "Redistributed widths", { 
        previous: previousWidths, 
        new: newBasis 
      });
      
      setFlexBasis(newBasis);
    } else if (flexBasis.length !== tabGroupsLength) {
      // Number of groups is the same but flexBasis length is different
      // This can happen if the flexBasis state wasn't properly updated
      debug("tabManagement", "Fixing flexBasis length mismatch");
      
      newBasis = redistributeAfterRemoval(previousWidths, previousLength, tabGroupsLength);
      setFlexBasis(newBasis);
    }

    // Update refs for next comparison
    previousGroupsLengthRef.current = tabGroupsLength;
    previousWidthsRef.current = newBasis || flexBasis;
  }, [
    tabGroupsLength, 
    flexBasis, 
    getGroupPriority, 
    getGroupMinWidth, 
    getContainerWidth
  ]);

  return {
    flexBasis,
    setFlexBasis,
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    getResizeInfo: () => ({
      dividerIndex: resizeRef.current.dividerIndex,
      cascadingGroups: resizeRef.current.cascadingGroups,
      minWidthReached: resizeRef.current.minWidthReached
    })
  };
}

export default useTabResize; 