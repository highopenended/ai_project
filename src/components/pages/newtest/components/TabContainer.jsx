import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove, onTabSplit, groupIndex }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);
    const [showBetweenIndicator, setShowBetweenIndicator] = useState(false);
    const tabRefs = useRef({});
    const originalPositions = useRef([]);
    const edgeThreshold = 40; // pixels from edge to trigger indicator
    const edgeHoldTimeout = useRef(null);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab, index) => {
        console.log('Drag start:', {
            tab: tab.type.name,
            index,
            groupIndex,
            totalGroups: e.currentTarget.parentElement.parentElement.children.length
        });
        
        // Get the original element's rect
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calculate where within the element the user clicked
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
        // Store original positions of all tabs
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
        
        setDraggedTab(tab);
        setDraggedTabIndex(index);

        // Store the tab info and indices
        const tabInfo = {
            type: tab.type.name,
            index: index
        };
        
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.setData('groupIndex', groupIndex.toString());
        e.dataTransfer.setData('tabInfo', JSON.stringify(tabInfo));
        e.dataTransfer.effectAllowed = 'move';

        // Create a drag image that maintains size
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.width = `${rect.width}px`;
        dragImage.style.height = `${rect.height}px`;
        dragImage.style.opacity = '0.5';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1000px';
        dragImage.style.backgroundColor = 'var(--background-tertiary)';
        dragImage.style.padding = window.getComputedStyle(e.currentTarget).padding;
        
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get header area bounds
        const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
        const isOverHeader = mouseY >= headerRect.top && mouseY <= headerRect.bottom;
        
        // Only process if we're within the vertical bounds of the container
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            // Check if we're near the edges of the container
            const distanceFromLeft = mouseX - containerRect.left;
            const distanceFromRight = containerRect.right - mouseX;
            const edgeThreshold = 40; // pixels from edge to trigger indicator

            // Get information about the current group's position
            const containerParent = e.currentTarget.parentElement;
            const allGroups = Array.from(containerParent.children);
            const currentGroupIndex = allGroups.indexOf(e.currentTarget);
            const isFirstGroup = currentGroupIndex === 0;
            const isLastGroup = currentGroupIndex === allGroups.length - 1;

            // Clear all indicators first
            setShowLeftIndicator(false);
            setShowRightIndicator(false);
            setShowBetweenIndicator(false);

            // If we're over the header, only handle within-group movement
            if (isOverHeader) {
                // Handle within-group movement
                const relativeX = mouseX - headerRect.left;
                
                // Find the insertion point based on original positions
                let newDropIndex = originalPositions.current.length;
                
                // Special case: if we're before the first tab's center
                if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
                    newDropIndex = 0;
                } else {
                    // Find the gap we're currently in
                    for (let i = 1; i < originalPositions.current.length; i++) {
                        const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                        const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                        
                        if (relativeX >= prevCenter && relativeX < currentCenter) {
                            newDropIndex = i;
                            break;
                        }
                    }
                }
                
                if (dropIndex !== newDropIndex) {
                    console.log('Tab reorder position:', newDropIndex);
                    setDropIndex(newDropIndex);
                }
            } 
            // When not over header, handle group creation/splitting
            else {
                // Handle edge cases for leftmost and rightmost groups
                if (isFirstGroup && distanceFromLeft < edgeThreshold) {
                    console.log('Edge position detected: Leftmost position');
                    setShowLeftIndicator(true);
                    setDropIndex(null);
                    return;
                }
                if (isLastGroup && distanceFromRight < edgeThreshold) {
                    console.log('Edge position detected: Rightmost position');
                    setShowRightIndicator(true);
                    setDropIndex(null);
                    return;
                }

                // Check for between-group position
                if (!isFirstGroup && distanceFromLeft < edgeThreshold) {
                    console.log(`Between-group position detected: Left of group ${currentGroupIndex}`);
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
                else if (!isLastGroup && distanceFromRight < edgeThreshold) {
                    console.log(`Between-group position detected: Right of group ${currentGroupIndex}`);
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
            }
        }
    };

    const handleDragLeave = (e) => {
        // Only clear indicators if we're actually leaving the container
        // and not entering a child element
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Check if the mouse is actually outside the container
        const isOutsideContainer = 
            mouseX < containerRect.left ||
            mouseX > containerRect.right ||
            mouseY < containerRect.top ||
            mouseY > containerRect.bottom;
            
        if (isOutsideContainer) {
            console.log('Mouse left container, clearing indicators');
            setShowLeftIndicator(false);
            setShowRightIndicator(false);
            setShowBetweenIndicator(false);
            if (edgeHoldTimeout.current) {
                clearTimeout(edgeHoldTimeout.current);
                edgeHoldTimeout.current = null;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        
        // Gather all the drop information
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const sourceGroupIndex = parseInt(e.dataTransfer.getData('groupIndex'));
        const tabInfo = JSON.parse(e.dataTransfer.getData('tabInfo'));
        
        // Store indicator states before clearing them
        const wasShowingLeftIndicator = showLeftIndicator;
        const wasShowingRightIndicator = showRightIndicator;
        const wasShowingBetweenIndicator = showBetweenIndicator;
        
        // Clear all indicators
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        
        // Handle the drop with clear priority:
        // 1. Between-group splitting
        // 2. Edge splitting
        // 3. Group-to-group movement
        if (wasShowingBetweenIndicator) {
            console.log('ACTION: Creating new group between existing groups');
            onTabSplit(tabInfo, sourceGroupIndex, groupIndex);
        }
        else if (wasShowingLeftIndicator || wasShowingRightIndicator) {
            console.log('ACTION: Creating new group at edge');
            onTabSplit(tabInfo, sourceGroupIndex, wasShowingRightIndicator);
        }
        else if (sourceGroupIndex !== groupIndex) {
            console.log('ACTION: Moving tab between groups');
            onTabMove([tabInfo], sourceGroupIndex, groupIndex);
            // Reset active tab to first tab in group when receiving a new tab
            setActiveTab(tabs[0]);
        }
        else if (sourceIndex !== dropIndex && dropIndex !== null) {
            console.log('ACTION: Reordering within same group');
            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(sourceIndex, 1);
            newTabs.splice(dropIndex, 0, movedTab);
            onTabMove(newTabs, groupIndex);
            // Update active tab if it was the one being moved
            if (activeTab === tabs[sourceIndex]) {
                setActiveTab(movedTab);
            }
        }

        // Reset drag state
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setDropIndex(null);
    };

    const getTabStyle = (index) => {
        if (draggedTabIndex === null || dropIndex === null) return {};
        
        if (index === draggedTabIndex) {
            return { visibility: 'hidden' }; // Hide original position but maintain space
        }
        
        const draggedRect = tabRefs.current[draggedTabIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        // Only move tabs that are between the drag source and drop target
        if (draggedTabIndex < dropIndex) {
            // Moving right: only move tabs between source and target to the left
            if (index > draggedTabIndex && index <= dropIndex) {
                return { transform: `translateX(-${tabWidth}px)` };
            }
        } else if (draggedTabIndex > dropIndex) {
            // Moving left: only move tabs between target and source to the right
            if (index >= dropIndex && index < draggedTabIndex) {
                return { transform: `translateX(${tabWidth}px)` };
            }
        }
        
        return {};
    };

    const handleDragEnd = () => {
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setDropIndex(null);
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
    };

    const getDropIndex = (clientX) => {
        const headerRect = document.querySelector('.tab-header').getBoundingClientRect();
        const relativeX = clientX - headerRect.left;
        
        // Find the insertion point based on original positions
        let dropIndex = originalPositions.current.length;
        
        // Special case: if we're before the first tab's center
        if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
            dropIndex = 0;
        } else {
            // Find the gap we're currently in
            for (let i = 1; i < originalPositions.current.length; i++) {
                const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                
                if (relativeX >= prevCenter && relativeX < currentCenter) {
                    dropIndex = i;
                    break;
                }
            }
        }
        
        return dropIndex;
    };

    return (
        <div 
            className={`tab-container ${showLeftIndicator ? 'show-left-indicator' : ''} ${showRightIndicator ? 'show-right-indicator' : ''} ${showBetweenIndicator ? 'show-between-indicator' : ''}`}
            onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(e);
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="tab-header">
                {tabs.map((tab, index) => (
                    <div
                        ref={el => tabRefs.current[index] = el}
                        key={`${tab.type.name}-${index}`}
                        className={`tab ${tab === activeTab ? 'active' : ''} 
                            ${draggedTab === tab ? 'dragging' : ''} 
                            ${dropIndex === index ? 'drag-over' : ''}`}
                        onClick={() => handleTabClick(tab)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, tab, index)}
                        onDragEnd={handleDragEnd}
                        style={getTabStyle(index)}
                    >
                        {tab.type.name}
                    </div>
                ))}
            </div>
            <div className="tab-content">
                {activeTab}
            </div>
        </div>
    );
}

TabContainer.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
    onTabMove: PropTypes.func.isRequired,
    onTabSplit: PropTypes.func.isRequired,
    groupIndex: PropTypes.number.isRequired,
};

export default TabContainer;
