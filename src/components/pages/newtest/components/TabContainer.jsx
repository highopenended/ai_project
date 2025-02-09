import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const tabRefs = useRef({});
    const originalPositions = useRef([]);

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
        const tabHeader = e.currentTarget.closest('.tab-header');
        if (!tabHeader) return;

        const mouseX = e.clientX;
        
        // Find the insertion point based on original positions
        let newDropIndex = originalPositions.current.length;
        
        // Special case: if we're before the first tab's center
        if (mouseX < originalPositions.current[0]?.center) {
            newDropIndex = 0;
        } else {
            // Find the gap we're currently in
            for (let i = 1; i < originalPositions.current.length; i++) {
                const prevCenter = originalPositions.current[i - 1]?.center;
                const currentCenter = originalPositions.current[i]?.center;
                
                if (mouseX >= prevCenter && mouseX < currentCenter) {
                    newDropIndex = i;
                    break;
                }
            }
        }

        // Only update if we've actually crossed a transition point
        if (dropIndex !== newDropIndex) {
            console.log(`Transition point: Mouse at ${mouseX} crossed between centers at ${originalPositions.current[Math.max(0, newDropIndex - 1)]?.center} and ${originalPositions.current[newDropIndex]?.center}`);
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
    };

    return (
        <div className="tab-container">
            <div 
                className="tab-header"
                onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(e);
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    console.log('Drop event triggered');
                    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    console.log('Drop details:', { sourceIndex, dropIndex });
                    
                    if (sourceIndex !== dropIndex && dropIndex !== null) {
                        const newTabs = [...tabs];
                        const [draggedTab] = newTabs.splice(sourceIndex, 1);
                        newTabs.splice(dropIndex, 0, draggedTab);
                        console.log('Moving tab:', { from: sourceIndex, to: dropIndex, newTabs });
                        onTabMove(newTabs);
                    }
                    setDraggedTab(null);
                    setDraggedIndex(null);
                    setDropIndex(null);
                }}
            >
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
};

export default TabContainer;
