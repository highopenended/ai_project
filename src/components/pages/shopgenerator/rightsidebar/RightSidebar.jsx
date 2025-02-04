import { useRef, useState, useCallback, useEffect } from 'react';
import './RightSidebar.css';

function RightSidebar() {
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(40);



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
        </div>
    );
}

export default RightSidebar;
