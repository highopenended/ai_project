/**
 * RightSidebar component for managing shop details and saved shops.
 * Provides functionality to save, load, and edit shop information.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onSave - Callback function when saving a shop
 * @param {Function} props.onLoad - Callback function when loading a shop
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import './RightSidebar.css';
import { useAuth } from "../../../../context/AuthContext";
// Import Firebase
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import PropTypes from 'prop-types';

// Initial shop details state
const INITIAL_SHOP_DETAILS = {
    type: '',
    name: '',
    keeper: '',
    location: '',
    shopkeeperDescription: '',
    shopDetails: '',
    shopkeeperDetails: ''
};

// Sidebar size constraints
const SIDEBAR_CONSTRAINTS = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 500,
    DEFAULT_WIDTH: 300
};

function RightSidebar({ onSave, onLoad }) {
    const { currentUser } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONSTRAINTS.DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [savedShops, setSavedShops] = useState([]);
    const [shopDetails, setShopDetails] = useState(INITIAL_SHOP_DETAILS);

    // Load saved shops when component mounts
    useEffect(() => {
        if (currentUser) {
            loadSavedShops();
        }
    }, [currentUser]);

    // Function to load saved shops from Firebase
    const loadSavedShops = async () => {
        try {
            const shopsRef = collection(db, `users/${currentUser.uid}/shops`);
            const shopsSnapshot = await getDocs(shopsRef);
            const shops = [];
            shopsSnapshot.forEach((doc) => {
                shops.push({ id: doc.id, ...doc.data() });
            });
            setSavedShops(shops);
        } catch (error) {
            console.error('Error loading shops:', error);
        }
    };

    // Function to load a specific shop
    const loadShop = (shop) => {
        // Extract shop details fields
        const shopDetailsFields = {
            type: shop.type || '',
            name: shop.name || '',
            keeper: shop.keeper || '',
            location: shop.location || '',
            shopkeeperDescription: shop.shopkeeperDescription || '',
            shopDetails: shop.shopDetails || '',
            shopkeeperDetails: shop.shopkeeperDetails || ''
        };
        setShopDetails(shopDetailsFields);

        // Pass all shop data to parent, including settings
        const shopData = {
            ...shop,
            goldAmount: shop.goldAmount || 5000,
            levelRange: shop.levelRange || { low: 0, high: 10 },
            shopBias: shop.shopBias || { x: 0.5, y: 0.5 },
            rarityDistribution: shop.rarityDistribution || {
                Common: 95.00,
                Uncommon: 4.50,
                Rare: 0.49,
                Unique: 0.01
            },
            categories: shop.categories || {},
            subcategories: shop.subcategories || {},
            traits: shop.traits || {},
            currentStock: shop.currentStock || []
        };
        
        onLoad(shopData);  // Pass the full shop data to parent
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

    // New function to handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShopDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    // Function to save shop data to Firebase
    const saveShopToFirebase = async () => {
        if (!currentUser) {
            console.error('User is not authenticated');
            return;
        }

        try {
            const shopData = await onSave(shopDetails);
            await setDoc(doc(db, `users/${currentUser.uid}/shops/${shopDetails.name}`), shopData);
            console.log('Shop saved successfully!');
            loadSavedShops(); // Refresh the list of saved shops
        } catch (error) {
            console.error('Error saving shop:', error);
        }
    };

    // Function to check if all shop details are filled
    const areAllDetailsFilled = useCallback(() => {
        return Object.values(shopDetails).every(detail => 
            detail && typeof detail === 'string' && detail.trim() !== ''
        );
    }, [shopDetails]);

    return (
        <div 
            className="right-sidebar" 
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
        >
            <div className="right-sidebar-content">
                <button 
                    className="action-button"
                    aria-label="Generate Shop Details"
                >
                    Generate Shop Details
                </button>
                
                {/* Saved Shops Section */}
                <div className="saved-shops-section">
                    <h3>Saved Shops</h3>
                    <select 
                        className="shop-select"
                        onChange={(e) => {
                            if (e.target.value) {
                                const selected = savedShops.find(shop => shop.name === e.target.value);
                                if (selected) loadShop(selected);
                            }
                        }}
                        value={shopDetails.name || ""}
                        aria-label="Select a saved shop"
                    >
                        <option value="">Select a saved shop</option>
                        {savedShops.map((shop) => (
                            <option key={shop.name} value={shop.name}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                </div>

                <h2>Shop Details</h2>
                <div className="shop-details">
                    {Object.keys(INITIAL_SHOP_DETAILS).map((key) => (
                        <div key={key} className="detail-section">
                            <h3>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                            <input
                                type="text"
                                name={key}
                                placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                value={shopDetails[key]}
                                onChange={handleInputChange}
                                aria-label={key.replace(/([A-Z])/g, ' $1')}
                            />
                        </div>
                    ))}
                </div>
                <div className="shop-actions">
                    <button 
                        className="action-button" 
                        onClick={saveShopToFirebase} 
                        disabled={!areAllDetailsFilled()}
                        aria-label="Save Shop"
                    >
                        Save Shop
                    </button>
                    <button 
                        className="action-button"
                        aria-label="Export to PDF"
                    >
                        Export to PDF
                    </button>
                </div>
            </div>
            <div 
                className={`right-resize-handle ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
                role="separator"
                aria-label="Resize sidebar"
            />
        </div>
    );
}

RightSidebar.propTypes = {
    onSave: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired
};

export default RightSidebar;
