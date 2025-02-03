import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BiasGrid.css';

function BiasGrid({ onChange }) {
    const gridRef = useRef(null);
    const [position, setPosition] = useState({ x: 0.5, y: 0.5 }); // Center by default
    const [isDragging, setIsDragging] = useState(false);

    const updatePosition = (clientX, clientY) => {
        if (!gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - ((clientY - rect.top) / rect.height))); // Invert Y so 0 is bottom
        
        setPosition({ x, y });
        onChange({ x, y });
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="bias-grid-container">
            <h3>Shop Bias</h3>
            <div 
                className="bias-grid"
                ref={gridRef}
                onMouseDown={handleMouseDown}
            >
                {/* Grid labels */}
                <div className="grid-label top">Expensive</div>
                <div className="grid-label bottom">Cheap</div>
                <div className="grid-label left">Low Variety</div>
                <div className="grid-label right">High Variety</div>

                {/* Grid lines */}
                <div className="grid-lines horizontal" />
                <div className="grid-lines vertical" />

                {/* Draggable dot */}
                <div 
                    className="grid-dot"
                    style={{
                        left: `${position.x * 100}%`,
                        bottom: `${position.y * 100}%`
                    }}
                />
            </div>

            {/* Debug values */}
            <div className="bias-values">
                <span>Variety: {(position.x * 100).toFixed(0)}%</span>
                <span>Cost: {(position.y * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}

BiasGrid.propTypes = {
    onChange: PropTypes.func.isRequired
};

export default BiasGrid; 