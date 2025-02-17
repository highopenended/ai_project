
import React, { useRef, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import './LeftSidebar.css';
import GenerateButton from './generatebutton/GenerateButton';

function LeftSidebar({ children, onGenerate }) {
    const sidebarRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });

    const handleGenerateClick = (e) => {
        if (e) e.preventDefault();
        onGenerate();
    }; 

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        dragInfo.current = {
            startX: e.clientX,
            startWidth: sidebarRef.current?.offsetWidth || 300
        };
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const { startX, startWidth } = dragInfo.current;
        const width = startWidth + (e.clientX - startX);
        const minWidth = 250;
        const maxWidth = 500;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, width));
        
        setSidebarWidth(newWidth);
        document.body.style.cursor = 'ew-resize';
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div 
            className="left-sidebar" 
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
        >
            <GenerateButton onClick={handleGenerateClick} />
            <div className="parameter-sections">
                {React.Children.map(children, (child, index) => (
                    <div className="parameter-section" key={index}>
                        {child}
                    </div>
                ))}
            </div>
            <div 
                className={`left-resize-handle ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
}

LeftSidebar.propTypes = {
    children: PropTypes.node.isRequired,
    onGenerate: PropTypes.func.isRequired,
};

export default LeftSidebar; 