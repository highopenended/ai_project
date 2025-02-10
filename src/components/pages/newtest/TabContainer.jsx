import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TabContainer = ({ tabs, groupIndex, onTabMove, onTabSplit }) => {
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);
    const [showBetweenIndicator, setShowBetweenIndicator] = useState(false);

    const getDropIndex = (clientX) => {
        const tabElements = document.querySelectorAll('.tab');
        for (let i = 0; i < tabElements.length; i++) {
            const rect = tabElements[i].getBoundingClientRect();
            if (clientX < rect.left + rect.width / 2) {
                return i;
            }
        }
        return tabElements.length;
    };

    const handleDragStart = (e, tab, index) => {
        // Store only essential tab information
        const tabInfo = {
            type: tab.type.name,
            index: index
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(tabInfo));
        setDraggedTabIndex(index);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const tabInfo = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Store indicator states before clearing them
        const wasShowingLeftIndicator = showLeftIndicator;
        const wasShowingRightIndicator = showRightIndicator;
        
        // Clear indicators
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        
        console.log('Drop details:', {
            tabInfo,
            sourceIndex: draggedTabIndex,
            showLeftIndicator: wasShowingLeftIndicator,
            showRightIndicator: wasShowingRightIndicator,
            groupIndex
        });

        if (wasShowingLeftIndicator || wasShowingRightIndicator) {
            // Split into new group
            console.log('Attempting to split tab into new group');
            onTabSplit(tabInfo, groupIndex, wasShowingRightIndicator);
        } else {
            // Move within current group
            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(draggedTabIndex, 1);
            const dropIndex = getDropIndex(e.clientX);
            newTabs.splice(dropIndex, 0, movedTab);
            onTabMove(newTabs, groupIndex);
        }

        setDraggedTabIndex(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (draggedTabIndex === null) return;

        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;
        
        // Define zones (10% of container width for edge detection)
        const edgeZone = containerWidth * 0.1;
        
        setShowLeftIndicator(mouseX <= edgeZone);
        setShowRightIndicator(mouseX >= containerWidth - edgeZone);
        setShowBetweenIndicator(mouseX > edgeZone && mouseX < containerWidth - edgeZone);
    };

    const handleDragLeave = (e) => {
        // Only clear indicators if we've actually left the container
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX < containerRect.left || 
            mouseX > containerRect.right ||
            mouseY < containerRect.top || 
            mouseY > containerRect.bottom) {
            setShowLeftIndicator(false);
            setShowRightIndicator(false);
            setShowBetweenIndicator(false);
        }
    };

    return (
        <div 
            className={`tab-container ${showLeftIndicator ? 'show-left-indicator' : ''} ${showRightIndicator ? 'show-right-indicator' : ''} ${showBetweenIndicator ? 'show-between-indicator' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
        >
            <div className="tab-header">
                {tabs.map((tab, index) => (
                    <div
                        key={tab.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tab, index)}
                        className="tab"
                    >
                        {tab}
                    </div>
                ))}
            </div>
        </div>
    );
};

TabContainer.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.element).isRequired,
    groupIndex: PropTypes.number.isRequired,
    onTabMove: PropTypes.func.isRequired,
    onTabSplit: PropTypes.func.isRequired
};

export default TabContainer; 