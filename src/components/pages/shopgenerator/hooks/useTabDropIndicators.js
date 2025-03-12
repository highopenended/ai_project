import { useState, useCallback } from "react";
import { debug } from '../../../../utils/debugUtils';
import useDebounce from '../../../../hooks/useDebounce';

/**
 * Custom hook for managing tab drop indicators
 * 
 * Centralizes all indicator logic for tab drag and drop operations:
 * - Group edge indicators (left/right)
 * - Between-group indicators
 * - Debounced updates to prevent visual flicker
 * 
 * @returns {Object} Indicator state and handlers
 * @property {Object} indicators - Current indicator state
 * @property {number|null} indicators.leftGroup - Group index for left edge indicator
 * @property {number|null} indicators.rightGroup - Group index for right edge indicator
 * @property {number|null} indicators.betweenGroups - Group index for between-groups indicator (left)
 * @property {number|null} indicators.betweenGroupsRight - Group index for between-groups indicator (right)
 * @property {Function} showIndicators - Function to show indicators
 * @property {Function} hideIndicators - Function to hide all indicators
 * @property {Function} hideGroupIndicators - Function to hide indicators for a specific group
 * @property {Function} determineDropAction - Function to determine drop action based on indicators
 */
function useTabDropIndicators() {
  // Consolidated indicator state
  const [indicators, setIndicators] = useState({
    leftGroup: null,
    rightGroup: null,
    betweenGroups: null,
    betweenGroupsRight: null
  });

  // Debounce indicator changes to prevent rapid updates and visual flicker
  const debouncedSetIndicators = useDebounce((newIndicators) => {
    setIndicators(prev => ({ ...prev, ...newIndicators }));
  }, 50);

  /**
   * Shows indicators based on mouse position and container properties
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {DOMRect} containerRect - Container bounding rectangle
   * @param {DOMRect} headerRect - Header bounding rectangle
   * @param {number} groupIndex - Current group index
   * @param {number} edgeThreshold - Distance from edge to trigger indicators
   * @param {boolean} isFirstGroup - Whether this is the first group
   * @param {boolean} isLastGroup - Whether this is the last group
   */
  const showIndicators = useCallback((
    mouseX,
    mouseY,
    containerRect,
    headerRect,
    groupIndex,
    edgeThreshold,
    isFirstGroup,
    isLastGroup
  ) => {
    // Only calculate indicators if mouse is within container
    if (
      !containerRect ||
      mouseX < containerRect.left ||
      mouseX > containerRect.right ||
      mouseY < containerRect.top ||
      mouseY > containerRect.bottom
    ) {
      return;
    }

    const isOverHeader = headerRect && mouseY >= headerRect.top && mouseY <= headerRect.bottom;
    const distanceFromLeft = mouseX - containerRect.left;
    const distanceFromRight = containerRect.right - mouseX;

    // Calculate dynamic edge threshold based on container width
    const containerWidth = containerRect.width;
    const dynamicEdgeThreshold = Math.min(edgeThreshold, containerWidth * 0.2);

    // Only show split indicators when NOT over the header
    const newIndicators = {
      leftGroup: !isOverHeader && isFirstGroup && distanceFromLeft < dynamicEdgeThreshold ? groupIndex : null,
      rightGroup: !isOverHeader && isLastGroup && distanceFromRight < dynamicEdgeThreshold ? groupIndex : null,
      betweenGroups: !isOverHeader && !isFirstGroup && distanceFromLeft < dynamicEdgeThreshold ? groupIndex : null,
      betweenGroupsRight: !isOverHeader && !isLastGroup && distanceFromRight < dynamicEdgeThreshold ? groupIndex : null
    };

    // Only update if there's a change
    if (
      newIndicators.leftGroup !== indicators.leftGroup ||
      newIndicators.rightGroup !== indicators.rightGroup ||
      newIndicators.betweenGroups !== indicators.betweenGroups ||
      newIndicators.betweenGroupsRight !== indicators.betweenGroupsRight
    ) {
      debug("tabManagement", "Updating drop indicators", newIndicators);
      debouncedSetIndicators(newIndicators);
    }
  }, [indicators, debouncedSetIndicators]);

  /**
   * Hides all indicators
   */
  const hideIndicators = useCallback(() => {
    setIndicators({
      leftGroup: null,
      rightGroup: null,
      betweenGroups: null,
      betweenGroupsRight: null
    });
  }, []);

  /**
   * Hides indicators for a specific group
   * @param {number} groupIndex - The group index to check
   */
  const hideGroupIndicators = useCallback((groupIndex) => {
    setIndicators(prev => {
      // Only update if this group has any indicators
      if (
        prev.leftGroup === groupIndex ||
        prev.rightGroup === groupIndex ||
        prev.betweenGroups === groupIndex ||
        prev.betweenGroupsRight === groupIndex
      ) {
        return {
          leftGroup: prev.leftGroup === groupIndex ? null : prev.leftGroup,
          rightGroup: prev.rightGroup === groupIndex ? null : prev.rightGroup,
          betweenGroups: prev.betweenGroups === groupIndex ? null : prev.betweenGroups,
          betweenGroupsRight: prev.betweenGroupsRight === groupIndex ? null : prev.betweenGroupsRight
        };
      }
      return prev;
    });
  }, []);

  /**
   * Determines what action to take based on drop indicators
   * @param {Object} params - Parameters for action determination
   * @param {number} params.groupIndex - Current group index
   * @param {number} params.sourceGroupIndex - Source group index
   * @returns {Object} Action to take and associated data
   */
  const determineDropAction = useCallback(({ groupIndex, sourceGroupIndex }) => {
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
  }, [indicators]);

  /**
   * Checks if any indicators are currently active
   * @returns {boolean} True if any indicators are active
   */
  const hasActiveIndicators = useCallback(() => {
    return Object.values(indicators).some(val => val !== null);
  }, [indicators]);

  return {
    indicators,
    showIndicators,
    hideIndicators,
    hideGroupIndicators,
    determineDropAction,
    hasActiveIndicators
  };
}

export default useTabDropIndicators; 