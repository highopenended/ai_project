import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggingTab, setDraggingTab] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const tabRefs = useRef({});

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab, index) => {
        setDraggingTab(tab);
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';

        // Create a drag image (optional)
        const dragImage = e.target.cloneNode(true);
        dragImage.style.opacity = '0.5';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggingTab && dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        
        if (dragIndex !== dropIndex) {
            const newTabs = [...tabs];
            const [draggedTab] = newTabs.splice(dragIndex, 1);
            newTabs.splice(dropIndex, 0, draggedTab);
            onTabMove(newTabs);
        }
        
        setDraggingTab(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggingTab(null);
        setDragOverIndex(null);
    };

    return (
        <div className="tab-container">
            <div className="tab-header">
                {tabs.map((tab, index) => (
                    <div
                        ref={el => tabRefs.current[index] = el}
                        key={`${tab.type.name}-${index}`}
                        className={`tab ${tab === activeTab ? 'active' : ''} 
                            ${draggingTab === tab ? 'dragging' : ''} 
                            ${dragOverIndex === index ? 'drag-over' : ''}`}
                        onClick={() => handleTabClick(tab)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tab, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
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
