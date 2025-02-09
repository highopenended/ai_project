import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const tabRefs = useRef({});

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
        
        setDraggedTab(tab);
        setDraggedIndex(index);
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Create a drag image that maintains size
        const dragImage = e.currentTarget.cloneNode(true);
        
        // Set explicit size to match original
        dragImage.style.width = `${rect.width}px`;
        dragImage.style.height = `${rect.height}px`;
        dragImage.style.opacity = '0.5';
        
        // Position offscreen while maintaining size
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1000px';
        dragImage.style.backgroundColor = 'var(--background-tertiary)';
        dragImage.style.padding = window.getComputedStyle(e.currentTarget).padding;
        
        document.body.appendChild(dragImage);
        
        // Use the calculated offset to position the drag image relative to the cursor
        e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
        
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const tabHeader = e.currentTarget.closest('.tab-header');
        if (!tabHeader) return;

        const mouseX = e.clientX;
        const tabElements = Array.from(tabHeader.children);
        
        // Find the insertion point based on mouse position
        let newDropIndex = tabElements.length;
        for (let i = 0; i < tabElements.length; i++) {
            const tab = tabElements[i];
            const rect = tab.getBoundingClientRect();
            const tabCenter = rect.left + rect.width / 2;
            
            if (mouseX < tabCenter) {
                newDropIndex = i;
                break;
            }
        }

        if (dropIndex !== newDropIndex) {
            setDropIndex(newDropIndex);
        }
    };

    const getTabStyle = (index) => {
        if (draggedIndex === null || dropIndex === null) return {};
        
        if (index === draggedIndex) {
            return { visibility: 'hidden' }; // Hide original position but maintain space
        }
        
        const draggedRect = tabRefs.current[draggedIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        // If dropping after current index, move left
        if (index >= dropIndex && index < draggedIndex) {
            return { transform: `translateX(${tabWidth}px)` };
        }
        
        // If dropping before current index, move right
        if (index <= dropIndex && index > draggedIndex) {
            return { transform: `translateX(-${tabWidth}px)` };
        }
        
        return {};
    };

    const handleDragEnd = () => {
        setDraggedTab(null);
        setDraggedIndex(null);
        setDropIndex(null);
    };

    return (
        <div className="tab-container">
            <div className="tab-header">
                {tabs.map((tab, index) => (
                    <div
                        ref={el => tabRefs.current[index] = el}
                        key={`${tab.type.name}-${index}`}
                        className={`tab ${tab === activeTab ? 'active' : ''} 
                            ${draggedTab === tab ? 'dragging' : ''} 
                            ${dropIndex === index ? 'drag-over' : ''}`}
                        onClick={() => handleTabClick(tab)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tab, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                            e.preventDefault();
                            const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            if (sourceIndex !== dropIndex && dropIndex !== null) {
                                const newTabs = [...tabs];
                                const [draggedTab] = newTabs.splice(sourceIndex, 1);
                                newTabs.splice(dropIndex, 0, draggedTab);
                                onTabMove(newTabs);
                            }
                            setDraggedTab(null);
                            setDraggedIndex(null);
                            setDropIndex(null);
                        }}
                        onDragEnd={handleDragEnd}
                        style={getTabStyle(index)}
                    >
                        {tab}
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
};

export default TabContainer;
