import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove, onTabSplit, groupIndex }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);
    const [isInDecoupleZone, setIsInDecoupleZone] = useState(false);
    const tabRefs = useRef({});
    const originalPositions = useRef([]);
    const edgeThreshold = 40; // pixels from edge to trigger indicator
    const edgeHoldTimeout = useRef(null);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab, index) => {
        console.log('Drag start:', { tab, index });
        
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
        setDraggedIndex(index);
        e.dataTransfer.setData('text/plain', index.toString());
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
        
        // Check if we're near the edges
        const distanceFromLeft = mouseX - containerRect.left;
        const distanceFromRight = containerRect.right - mouseX;
        
        // Only process if we're within the vertical bounds of the container
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            if (distanceFromLeft < edgeThreshold) {
                // Only trigger if we weren't already in a decouple zone
                if (!isInDecoupleZone) {
                    console.log(`Entered left decouple zone: ${distanceFromLeft}px from left edge`);
                    setIsInDecoupleZone(true);
                    setShowRightIndicator(false);
                    // Set timeout for left edge
                    if (edgeHoldTimeout.current) {
                        clearTimeout(edgeHoldTimeout.current);
                    }
                    edgeHoldTimeout.current = setTimeout(() => {
                        console.log('Left decouple triggered after holding!');
                        setShowLeftIndicator(true);
                    }, 500);
                }
            } else if (distanceFromRight < edgeThreshold) {
                // Only trigger if we weren't already in a decouple zone
                if (!isInDecoupleZone) {
                    console.log(`Entered right decouple zone: ${distanceFromRight}px from right edge`);
                    setIsInDecoupleZone(true);
                    setShowLeftIndicator(false);
                    // Set timeout for right edge
                    if (edgeHoldTimeout.current) {
                        clearTimeout(edgeHoldTimeout.current);
                    }
                    edgeHoldTimeout.current = setTimeout(() => {
                        console.log('Right decouple triggered after holding!');
                        setShowRightIndicator(true);
                    }, 500);
                }
            } else {
                // If we were in a decouple zone and now we're not
                if (isInDecoupleZone) {
                    console.log('Left decouple zone');
                    setIsInDecoupleZone(false);
                    setShowLeftIndicator(false);
                    setShowRightIndicator(false);
                    if (edgeHoldTimeout.current) {
                        clearTimeout(edgeHoldTimeout.current);
                        edgeHoldTimeout.current = null;
                    }
                }
                
                // For tab sliding, we only care about horizontal position relative to tab centers
                const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
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

                // Only update if we've actually crossed a transition point
                if (dropIndex !== newDropIndex) {
                    console.log(`Transition point: Mouse at ${relativeX} crossed between centers at ${originalPositions.current[Math.max(0, newDropIndex - 1)]?.center - headerRect.left} and ${originalPositions.current[newDropIndex]?.center - headerRect.left}`);
                    setDropIndex(newDropIndex);
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
            if (edgeHoldTimeout.current) {
                clearTimeout(edgeHoldTimeout.current);
                edgeHoldTimeout.current = null;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        console.log('Drop event triggered');
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        
        // Store the current indicator states before clearing them
        const wasShowingLeftIndicator = showLeftIndicator;
        const wasShowingRightIndicator = showRightIndicator;
        
        console.log('Drop details:', { 
            sourceIndex, 
            showLeftIndicator: wasShowingLeftIndicator, 
            showRightIndicator: wasShowingRightIndicator, 
            groupIndex,
            tabToSplit: tabs[sourceIndex]
        });

        // Clear indicators and timeouts
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }

        // Handle splitting if we were showing an indicator
        if (wasShowingLeftIndicator || wasShowingRightIndicator) {
            console.log('Attempting to split tab into new group');
            const tabToSplit = tabs[sourceIndex];
            onTabSplit(tabToSplit, groupIndex, wasShowingRightIndicator);
        } else if (sourceIndex !== dropIndex && dropIndex !== null) {
            const newTabs = [...tabs];
            const [draggedTab] = newTabs.splice(sourceIndex, 1);
            newTabs.splice(dropIndex, 0, draggedTab);
            console.log('Moving tab:', { from: sourceIndex, to: dropIndex, newTabs });
            onTabMove(newTabs);
        }

        setDraggedTab(null);
        setDraggedIndex(null);
        setDropIndex(null);
        setIsInDecoupleZone(false);
    };

    const getTabStyle = (index) => {
        if (draggedIndex === null || dropIndex === null) return {};
        
        if (index === draggedIndex) {
            return { visibility: 'hidden' }; // Hide original position but maintain space
        }
        
        const draggedRect = tabRefs.current[draggedIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        // Only move tabs that are between the drag source and drop target
        if (draggedIndex < dropIndex) {
            // Moving right: only move tabs between source and target to the left
            if (index > draggedIndex && index <= dropIndex) {
                return { transform: `translateX(-${tabWidth}px)` };
            }
        } else if (draggedIndex > dropIndex) {
            // Moving left: only move tabs between target and source to the right
            if (index >= dropIndex && index < draggedIndex) {
                return { transform: `translateX(${tabWidth}px)` };
            }
        }
        
        return {};
    };

    const handleDragEnd = () => {
        setDraggedTab(null);
        setDraggedIndex(null);
        setDropIndex(null);
        setIsInDecoupleZone(false);
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
    };

    return (
        <div 
            className={`tab-container ${showLeftIndicator ? 'show-left-indicator' : ''} ${showRightIndicator ? 'show-right-indicator' : ''}`}
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
