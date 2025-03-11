import { useState, useRef, useCallback, useEffect } from "react";
import { debug, trackPerformance, createMark } from '../../../../utils/debugUtils';

// Constants
const MIN_WIDTH_PX = 200;
const RESIZE_THROTTLE_MS = 16; // ~60fps

/**
 * Custom hook for managing tab group resizing
 * 
 * Handles the resizing of tab groups with:
 * - Minimum width constraints
 * - Performance throttling
 * - Percentage-based width calculations
 * - Global mouse event handling
 * 
 * @param {Object} params - Hook parameters
 * @param {Array<string>} params.initialGroupWidths - Initial widths for tab groups
 * @param {number} params.tabGroupsLength - Number of tab groups
 * @returns {Object} Resize handlers and state
 * @property {Array<string>} flexBasis - Current widths for tab groups
 * @property {Function} setFlexBasis - Function to update group widths
 * @property {boolean} isResizing - Whether a resize operation is in progress
 * @property {Function} handleResize - Handler for group resizing
 */
function useTabResize({ initialGroupWidths, tabGroupsLength }) {
  // State for group widths
  const [flexBasis, setFlexBasis] = useState(initialGroupWidths);
  const [isResizing, setIsResizing] = useState(false);
  const lastResizeTimeRef = useRef(0);
  
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
   * Initializes flex basis when group count changes
   */
  useEffect(() => {
    // Early return if no change needed
    if (tabGroupsLength === flexBasis.length) {
      return;
    }

    debug("tabManagement", "Updating widths", { tabGroupsLength });

    const defaultWidths = Array(tabGroupsLength).fill(`${100 / tabGroupsLength}%`);
    setFlexBasis(defaultWidths);
  }, [tabGroupsLength, flexBasis.length]);

  return {
    flexBasis,
    setFlexBasis,
    isResizing,
    handleResize,
    handleResizeEnd
  };
}

export default useTabResize; 