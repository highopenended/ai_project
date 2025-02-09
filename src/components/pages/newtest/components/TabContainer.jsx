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
        setDraggedTab(tab);
        setDraggedIndex(index);
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';

        // Create a drag image (optional)
        const dragImage = e.target.cloneNode(true);
        dragImage.style.opacity = '0.5';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
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
            return { opacity: 0.5 };
        }
        
        if (dropIndex > draggedIndex && index > draggedIndex && index <= dropIndex) {
            return { transform: 'translateX(-100%)' };
        }
        
        if (dropIndex < draggedIndex && index < draggedIndex && index >= dropIndex) {
            return { transform: 'translateX(100%)' };
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
