import { useState, useRef, useCallback, useEffect } from "react";
import { debug, trackPerformance, createMark } from '../../../../utils/debugUtils';
import { TAB_PRIORITIES } from '../utils/tabConstants';

// Constants
const MIN_WIDTH_PX = 0;
const RESIZE_THROTTLE_MS = 16; // ~60fps
const DEFAULT_PRIORITY = 2; // Default priority if not found

/**
 * Custom hook for managing tab group resizing
 * 
 * Handles the resizing of tab groups with:
 * - Minimum width constraints
 * - Performance throttling
 * - Percentage-based width calculations
 * - Global mouse event handling
 * - Priority-based resizing when tab groups change
 * 
 * @param {Object} params - Hook parameters
 * @param {Array<string>} params.initialGroupWidths - Initial widths for tab groups
 * @param {number} params.tabGroupsLength - Number of tab groups
 * @param {Array<Array<Object>>} [params.tabGroups] - Current tab groups configuration
 * @param {Object} [params.activeTabTypes] - Map of active tab types for each group
 * @returns {Object} Resize handlers and state
 * @property {Array<string>} flexBasis - Current widths for tab groups
 * @property {Function} setFlexBasis - Function to update group widths
 * @property {boolean} isResizing - Whether a resize operation is in progress
 * @property {Function} handleResize - Handler for group resizing
 */
function useTabResize({ initialGroupWidths, tabGroupsLength, tabGroups, activeTabTypes }) {
  // State for group widths
  const [flexBasis, setFlexBasis] = useState(initialGroupWidths);
  const [isResizing, setIsResizing] = useState(false);
  const lastResizeTimeRef = useRef(0);
  const previousGroupsLengthRef = useRef(tabGroupsLength);
  const previousWidthsRef = useRef(initialGroupWidths);
  
  // Resize tracking ref
  const resizeRef = useRef({ active: false });

  /**
   * Gets the container width for resize calculations
   * @returns {number} Width of the container in pixels
   */
  const getContainerWidth = useCallback(() => {
    const container = document.querySelector(".shop-generator");
    return container ? container.clientWidth : 0;
  }, []);

  /**
   * Gets the priority of a tab group based on its active tab
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
      if (firstTab && firstTab.type && firstTab.type.name) {
        return TAB_PRIORITIES[firstTab.type.name] || DEFAULT_PRIORITY;
      }
      return DEFAULT_PRIORITY;
    }

    // Return the priority for this tab type
    return TAB_PRIORITIES[activeTabType] || DEFAULT_PRIORITY;
  }, [tabGroups, activeTabTypes]);

  /**
   * Handles resizing of tab groups with throttling
   * @param {number} newWidth - New width in pixels
   * @param {number} groupIndex - Index of the group being resized
   */
  const handleResize = useCallback((newWidth, groupIndex) => {
    const startMark = createMark('tabManagement', 'Resize Operation');

    // Validate inputs
    if (groupIndex >= tabGroupsLength - 1) {
      debug("tabManagement", "Invalid group index for resize", { groupIndex });
      return;
    }

    // Apply throttling
    const now = Date.now();
    if (now - lastResizeTimeRef.current < RESIZE_THROTTLE_MS) {
      return;
    }

    debug("tabManagement", "Processing resize", { groupIndex, newWidth });

    // Get container width
    const totalWidth = getContainerWidth();
    if (!totalWidth) {
      debug("tabManagement", "No container width available");
      return;
    }

    // Update resize state
    setIsResizing(true);
    lastResizeTimeRef.current = now;

    // Calculate and apply new widths
    setFlexBasis(prev => {
      const newBasis = [...prev];
      const minWidthPercent = (MIN_WIDTH_PX / totalWidth) * 100;

      // Calculate new percentages
      let currentPercent = Math.max((newWidth / totalWidth) * 100, minWidthPercent);
      const remainingPercent = parseFloat(prev[groupIndex]) + parseFloat(prev[groupIndex + 1]);
      const nextGroupPercent = remainingPercent - currentPercent;

      // Ensure minimum width constraints
      if (nextGroupPercent < minWidthPercent) {
        debug("tabManagement", "Next group would be too small", {
          nextGroupPercent,
          minWidthPercent,
        });
        return prev;
      }

      // Apply new widths
      newBasis[groupIndex] = `${currentPercent}%`;
      newBasis[groupIndex + 1] = `${nextGroupPercent}%`;

      debug("tabManagement", "Updated basis", {
        current: currentPercent,
        next: nextGroupPercent,
      });

      trackPerformance('tabManagement', 'Resize Operation', startMark);
      return newBasis;
    });
  }, [tabGroupsLength, getContainerWidth]);

  /**
   * Resets resize state
   */
  const handleResizeEnd = useCallback(() => {
    debug("tabManagement", "Ending resize operation");
    setIsResizing(false);
  }, []);

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
      currentRef.active = false;
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
    const currentRef = resizeRef.current;
    currentRef.active = isResizing;
  }, [isResizing]);

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
          : 0
      }));

    // Sort groups by priority (lowest first)
    groupPriorities.sort((a, b) => a.priority - b.priority);
    
    debug("tabManagement", "Group priorities", groupPriorities);

    // Determine if we're adding or removing groups
    const isAdding = tabGroupsLength > previousLength;
    const isDifferent = tabGroupsLength !== previousLength;

    if (isDifferent) {
      let newWidths;
      
      if (isAdding) {
        // Adding groups - take space from lowest priority groups
        newWidths = redistributeForNewGroups(
          previousWidths, 
          tabGroupsLength, 
          groupPriorities
        );
      } else {
        // Removing groups - redistribute freed space to remaining groups
        // based on inverse priority (lower priority gets more space)
        newWidths = redistributeAfterRemoval(
          previousWidths, 
          previousLength, 
          tabGroupsLength, 
          groupPriorities
        );
      }

      debug("tabManagement", "New widths after redistribution", newWidths);
      setFlexBasis(newWidths);
    }

    // Update refs for next comparison
    previousGroupsLengthRef.current = tabGroupsLength;
    previousWidthsRef.current = flexBasis;
  }, [tabGroupsLength, flexBasis.length, getGroupPriority]);

  /**
   * Redistributes space when adding new groups
   * Takes space from lowest priority groups
   * 
   * @param {Array<string>} previousWidths - Previous width percentages
   * @param {number} newLength - New number of groups
   * @param {Array<Object>} groupPriorities - Sorted group priorities
   * @returns {Array<string>} New width percentages
   */
  const redistributeForNewGroups = (previousWidths, newLength, groupPriorities) => {
    // Convert percentage strings to numbers
    const numericWidths = previousWidths.map(w => parseFloat(w));
    
    // Calculate how many new groups we're adding
    const addedGroups = newLength - numericWidths.length;
    
    // Default width for new groups (reasonable starting point)
    const defaultNewGroupWidth = 10; // 10%
    
    // Total width needed for new groups
    const totalNewWidth = defaultNewGroupWidth * addedGroups;
    
    // Create a new array with the current widths
    let newWidths = [...numericWidths];
    
    // Add placeholder widths for new groups
    for (let i = 0; i < addedGroups; i++) {
      newWidths.push(defaultNewGroupWidth);
    }
    
    // Calculate how much we need to reduce existing groups
    let widthToReduce = totalNewWidth;
    
    // Take width from lowest priority groups first
    for (const group of groupPriorities) {
      // Skip if this is a new group (index >= previous length)
      if (group.index >= numericWidths.length) continue;
      
      // Calculate how much we can take from this group
      // Don't reduce below 10% to ensure usability
      const currentWidth = numericWidths[group.index];
      const minWidth = 10; // Minimum 10% width
      const availableToTake = Math.max(0, currentWidth - minWidth);
      
      if (availableToTake > 0) {
        // Take what we need, up to what's available
        const amountToTake = Math.min(widthToReduce, availableToTake);
        newWidths[group.index] -= amountToTake;
        widthToReduce -= amountToTake;
        
        // Stop if we've reduced enough
        if (widthToReduce <= 0) break;
      }
    }
    
    // If we still need to reduce more, take proportionally from all groups
    if (widthToReduce > 0) {
      const totalCurrentWidth = newWidths.reduce((sum, width, i) => 
        i < numericWidths.length ? sum + width : sum, 0);
      
      for (let i = 0; i < numericWidths.length; i++) {
        const reductionRatio = newWidths[i] / totalCurrentWidth;
        const additionalReduction = widthToReduce * reductionRatio;
        newWidths[i] -= additionalReduction;
      }
    }
    
    // Ensure total is 100%
    const total = newWidths.reduce((sum, width) => sum + width, 0);
    if (Math.abs(total - 100) > 0.1) {
      // Normalize to 100%
      newWidths = newWidths.map(width => (width / total) * 100);
    }
    
    // Convert back to percentage strings
    return newWidths.map(w => `${w}%`);
  };

  /**
   * Redistributes space when removing groups
   * Gives more space to lower priority groups
   * 
   * @param {Array<string>} previousWidths - Previous width percentages
   * @param {number} previousLength - Previous number of groups
   * @param {number} newLength - New number of groups
   * @param {Array<Object>} groupPriorities - Sorted group priorities
   * @returns {Array<string>} New width percentages
   */
  const redistributeAfterRemoval = (previousWidths, previousLength, newLength, groupPriorities) => {
    // Convert percentage strings to numbers
    const numericWidths = previousWidths.map(w => parseFloat(w));
    
    // Calculate total width of removed groups
    let freedWidth = 0;
    for (let i = newLength; i < previousLength; i++) {
      if (i < numericWidths.length) {
        freedWidth += numericWidths[i];
      }
    }
    
    // Create new widths array with only the remaining groups
    let newWidths = numericWidths.slice(0, newLength);
    
    // Calculate inverse priorities (lower priority gets more space)
    const maxPriority = Math.max(...groupPriorities.map(g => g.priority));
    const inversePriorities = groupPriorities
      .filter(g => g.index < newLength) // Only consider remaining groups
      .map(g => ({
        index: g.index,
        inversePriority: maxPriority - g.priority + 1 // +1 to ensure even priority 0 gets something
      }));
    
    // Calculate total inverse priority for distribution ratio
    const totalInversePriority = inversePriorities.reduce(
      (sum, g) => sum + g.inversePriority, 0
    );
    
    // Distribute freed width based on inverse priority
    if (totalInversePriority > 0) {
      for (const group of inversePriorities) {
        const distributionRatio = group.inversePriority / totalInversePriority;
        newWidths[group.index] += freedWidth * distributionRatio;
      }
    } else {
      // Fallback: distribute equally
      const equalShare = freedWidth / newLength;
      newWidths = newWidths.map(w => w + equalShare);
    }
    
    // Ensure total is 100%
    const total = newWidths.reduce((sum, width) => sum + width, 0);
    if (Math.abs(total - 100) > 0.1) {
      // Normalize to 100%
      newWidths = newWidths.map(width => (width / total) * 100);
    }
    
    // Convert back to percentage strings
    return newWidths.map(w => `${w}%`);
  };

  return {
    flexBasis,
    setFlexBasis,
    isResizing,
    handleResize,
    handleResizeEnd
  };
}

export default useTabResize; 