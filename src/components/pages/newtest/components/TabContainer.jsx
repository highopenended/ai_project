import { useState } from 'react';
import PropTypes from 'prop-types';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab) => {
        e.dataTransfer.setData('tab', tab);
    };

    const handleDrop = (e) => {
        const tab = e.dataTransfer.getData('tab');
        onTabMove(tab);
    };

    return (
        <div className="tab-container" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            <div className="tab-header">
                {tabs.map((tab, tabIndex) => (
                    <div
                        key={`${tab.type.name}-${tabIndex}`}
                        className={`tab ${tab === activeTab ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tab)}
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
