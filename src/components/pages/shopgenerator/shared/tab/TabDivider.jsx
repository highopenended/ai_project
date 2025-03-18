import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';
import './TabDivider.css';

/**
 * TabDivider Component
 * 
 * A standalone component that handles the divider between tab groups,
 * providing bidirectional cascading resize functionality.
 * 
 * Features:
 * - Handles resize operations in both directions
 * - Provides visual feedback during resize
 * - Supports cascading resize when adjacent groups reach minimum width
 * - Shows tooltip when minimum width is reached
 * 
 * @param {Object} props - Component props
 * @param {number} props.dividerIndex - Index of this divider (between groups)
 * @param {Function} props.onResizeStart - Callback when resize starts
 * @param {Function} props.onResize - Callback for resize operations
 * @param {Function} props.onResizeEnd - Callback when resize ends
 * @param {boolean} props.isResizing - Whether a resize operation is in progress
 * @param {Object} props.resizeInfo - Information about the current resize operation
 */
function TabDivider({ 
    dividerIndex,
    onResizeStart,
    onResize,
    onResizeEnd,
    isResizing,
    resizeInfo
}) {
    const [hovered, setHovered] = useState(false);
    const dividerRef = useRef(null);
    
    // Determine if this divider is the one being resized
    const isActive = isResizing && 
        (resizeInfo.dividerIndex === dividerIndex);
    
    // Determine if minimum width has been reached
    const minWidthReached = isActive && resizeInfo.minWidthReached;
    
    // Determine if this divider is involved in cascading resize
    const isCascading = isResizing && 
        resizeInfo.cascadingGroups?.includes(dividerIndex) || 
        resizeInfo.cascadingGroups?.includes(dividerIndex + 1);
    
    // Log state changes for debugging
    useEffect(() => {
        if (isActive) {
            console.log(`%c[TabDivider ${dividerIndex}] Active: ${isActive}`, 'color: #9c27b0');
        }
        
        if (minWidthReached) {
            console.log(`%c[TabDivider ${dividerIndex}] Minimum width reached`, 'color: #ff5252; font-weight: bold');
        }
        
        if (isCascading) {
            console.log(`%c[TabDivider ${dividerIndex}] Cascading active`, 'color: #4caf50; font-weight: bold');
        }
    }, [dividerIndex, isActive, minWidthReached, isCascading]);
    
    /**
     * Handles mouse down to start resize operation
     * @param {MouseEvent} e - The mouse down event
     */
    const handleMouseDown = (e) => {
        e.preventDefault();
        
        console.log(`%c[TabDivider ${dividerIndex}] Mouse down - Starting resize`, 'color: #2196f3');
        
        // Get initial position
        const startX = e.clientX;
        
        // Notify parent component
        onResizeStart(dividerIndex);
        
        const handleMouseMove = (e) => {
            // Calculate delta from start position
            const delta = e.clientX - startX;
            
            // Call parent resize handler with delta
            onResize(dividerIndex, delta);
        };
        
        const handleMouseUp = () => {
            console.log(`%c[TabDivider ${dividerIndex}] Mouse up - Ending resize`, 'color: #2196f3');
            
            // Notify parent component
            onResizeEnd();
            
            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        // Add global event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    // Determine tooltip text based on state
    let tooltipText = '';
    if (minWidthReached) {
        tooltipText = 'Minimum width reached';
    } else if (isCascading) {
        tooltipText = 'Cascading resize active';
    }
    
    return (
        <div 
            ref={dividerRef}
            className={`tab-divider 
                ${isActive ? 'active' : ''} 
                ${hovered ? 'hovered' : ''} 
                ${minWidthReached ? 'min-width-reached' : ''} 
                ${isCascading ? 'cascading' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Resize tab groups"
            role="separator"
            data-tooltip={tooltipText || undefined}
        />
    );
}

TabDivider.propTypes = {
    /** Index of this divider (between groups) */
    dividerIndex: PropTypes.number.isRequired,
    /** Callback when resize starts */
    onResizeStart: PropTypes.func.isRequired,
    /** Callback for resize operations */
    onResize: PropTypes.func.isRequired,
    /** Callback when resize ends */
    onResizeEnd: PropTypes.func.isRequired,
    /** Whether a resize operation is in progress */
    isResizing: PropTypes.bool.isRequired,
    /** Information about the current resize operation */
    resizeInfo: PropTypes.shape({
        dividerIndex: PropTypes.number,
        cascadingGroups: PropTypes.array,
        minWidthReached: PropTypes.bool
    }).isRequired
};

export default TabDivider; 