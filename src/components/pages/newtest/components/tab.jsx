import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import React from 'react';

function Tab({ 
    tab, 
    index, 
    isActive, 
    isDragging, 
    isDropTarget,
    tabRef,
    style,
    onTabClick,
    onDragStart,
    onDragEnd 
}) {
    return (
        <div
            ref={tabRef}
            className={`tab ${isActive ? 'active' : ''} 
                ${isDragging ? 'dragging' : ''} 
                ${isDropTarget ? 'drag-over' : ''}`}
            onClick={() => onTabClick(tab)}
            draggable="true"
            onDragStart={(e) => onDragStart(e, tab, index)}
            onDragEnd={onDragEnd}
            style={style}
        >
            {tab.type.name}
        </div>
    );
}

Tab.propTypes = {
    tab: PropTypes.node.isRequired,
    index: PropTypes.number.isRequired,
    isActive: PropTypes.bool.isRequired,
    isDragging: PropTypes.bool.isRequired,
    isDropTarget: PropTypes.bool.isRequired,
    tabRef: PropTypes.func.isRequired,
    style: PropTypes.object,
    onTabClick: PropTypes.func.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired
};

export default Tab; 