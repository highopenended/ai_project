import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import Tab from './tab.jsx';
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
    const edgeThreshold = 40;
    const edgeHoldTimeout = useRef(null);

    // Update active tab if the current one is no longer in the tabs array
    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab, index) => {
        // Safety check for tab structure
        if (!tab || !tab.type) {
            console.error('Invalid tab structure in handleDragStart:', tab);
            return;
        }

        // Store original positions of all tabs
        const tabElements = Array.from(e.currentTarget.parentElement.children);
        
        console.log('Drag start:', {
            tab: tab.type.name,
            index,
            groupIndex,
            totalGroups: tabElements.length
        });
        
        // Get the original element's rect
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calculate where within the element the user clicked
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        
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
        
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.setData('groupIndex', groupIndex.toString());
        e.dataTransfer.setData('tabInfo', JSON.stringify({
            type: tab.type.name || 'unknown',
            index: index,
            key: tab.key || `tab-${index}`
        }));
        // Store the tab reference in a global variable temporarily
        window.__draggedTab = tab;
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
                    setDropIndex(newDropIndex);
                }
            } 
            // When not over header, handle group creation/splitting
            else {
                // Handle edge cases for leftmost and rightmost groups
                if (isFirstGroup && distanceFromLeft < edgeThreshold) {
                    setShowLeftIndicator(true);
                    setDropIndex(null);
                    return;
                }
                if (isLastGroup && distanceFromRight < edgeThreshold) {
                    setShowRightIndicator(true);
                    setDropIndex(null);
                    return;
                }

                // Check for between-group position
                if (!isFirstGroup && distanceFromLeft < edgeThreshold) {
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
                else if (!isLastGroup && distanceFromRight < edgeThreshold) {
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
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
        
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const sourceGroupIndex = parseInt(e.dataTransfer.getData('groupIndex'));
        const tabInfo = JSON.parse(e.dataTransfer.getData('tabInfo'));
        
        const wasShowingLeftIndicator = showLeftIndicator;
        const wasShowingRightIndicator = showRightIndicator;
        const wasShowingBetweenIndicator = showBetweenIndicator;
        
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        
        // Get the stored tab reference
        const draggedTab = window.__draggedTab;
        delete window.__draggedTab; // Clean up
        
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
            // If dropIndex is null (not over header), append to end of target group
            const targetIndex = dropIndex !== null ? dropIndex : tabs.length;
            onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
        }
        else if (sourceIndex !== dropIndex && dropIndex !== null) {
            console.log('ACTION: Reordering within same group');
            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(sourceIndex, 1);
            newTabs.splice(dropIndex, 0, movedTab);
            onTabMove(newTabs, groupIndex);
            if (activeTab === tabs[sourceIndex]) {
                setActiveTab(movedTab);
            }
        }

        setDraggedTab(null);
        setDraggedTabIndex(null);
        setDropIndex(null);
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
        // Clean up the global reference if drag is cancelled
        delete window.__draggedTab;
    };

    const getTabStyle = (index) => {
        if (draggedTabIndex === null || dropIndex === null) return {};
        
        if (index === draggedTabIndex) {
            return { visibility: 'hidden' };
        }
        
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
                {tabs.map((tab, index) => {
                    // Safety check for tab structure
                    if (!tab || !tab.type) {
                        console.error('Invalid tab structure:', tab);
                        return null;
                    }

                    const tabKey = tab.key || `tab-${tab.type.name || 'unknown'}-${index}`;
                    
                    return (
                        <Tab
                            key={tabKey}
                            tab={tab}
                            index={index}
                            isActive={tab === activeTab}
                            isDragging={draggedTab === tab}
                            isDropTarget={dropIndex === index}
                            tabRef={el => tabRefs.current[index] = el}
                            style={getTabStyle(index)}
                            onTabClick={handleTabClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        />
                    );
                })}
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
