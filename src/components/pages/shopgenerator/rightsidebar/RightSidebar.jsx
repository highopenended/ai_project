import { useRef, useState, useCallback, useEffect } from 'react';
import './RightSidebar.css';

function RightSidebar() {
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });

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
        const width = startWidth - (e.clientX - startX);
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
            className="right-sidebar" 
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
        >           
            <div className="right-sidebar-content">
                <h2>Shop Details</h2>
                <div className="shop-details">
                    <div className="detail-section">
                        <h3>Shop Type</h3>
                        <p>General Store</p>
                    </div>
                    <div className="detail-section">
                        <h3>Shop Name</h3>
                        <p>The Adventurer&apos;s Rest</p>
                    </div>
                    <div className="detail-section">
                        <h3>Shopkeeper</h3>
                        <p>Eldrin Brightweave</p>
                    </div>
                    <div className="detail-section">
                        <h3>Location</h3>
                        <p>Market District</p>
                    </div>
                </div>
                <div className="shop-actions">
                    <button className="action-button">Save Shop</button>
                    <button className="action-button">Export to PDF</button>
                </div>
            </div>
            <div 
                className={`right-resize-handle ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
}

export default RightSidebar;
