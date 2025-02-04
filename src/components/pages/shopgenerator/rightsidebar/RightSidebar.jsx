import { useRef, useState, useCallback, useEffect } from 'react';
import './RightSidebar.css';
import { useAuth } from "../../../../context/AuthContext";
// Import Firebase
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';


function RightSidebar() {
    const { currentUser } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [savedShops, setSavedShops] = useState([]);

    // New state for shop details
    const [shopDetails, setShopDetails] = useState({
        type: '',
        name: '',
        keeper: '',
        location: '',
        shopkeeperDescription: '',
        shopDetails: '',
        shopkeeperDetails: ''
    });

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
        setShopDetails(shop);
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
            const shopData = {
                ...shopDetails,
                // Add LeftSidebar parameters and ItemTable info here
                // Example: goldAmount, shopBias, rarityDistributions, etc.
            };
            await setDoc(doc(db, `users/${currentUser.uid}/shops/${shopDetails.name}`), shopData);
            console.log('Shop saved successfully!');
        } catch (error) {
            console.error('Error saving shop:', error);
        }
    };

    // Function to check if all shop details are filled
    const areAllDetailsFilled = () => {
        return Object.values(shopDetails).every(detail => detail.trim() !== '');
    };

    return (
        <div 
            className="right-sidebar" 
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
        >
            <div className="right-sidebar-content">
                <button className="action-button">Generate Shop Details</button>
                
                {/* Add dropdown for saved shops */}
                <div className="saved-shops-section">
                    <h3>Saved Shops</h3>
                    <select 
                        className="shop-select"
                        onChange={(e) => {
                            const selected = savedShops.find(shop => shop.id === e.target.value);
                            if (selected) loadShop(selected);
                        }}
                        value=""
                    >
                        <option value="">Select a saved shop</option>
                        {savedShops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                </div>

                <h2>Shop Details</h2>
                <div className="shop-details">
                    <div className="detail-section">
                        <h3>Shop Type</h3>
                        <input
                            type="text"
                            name="type"
                            placeholder="Enter shop type"
                            value={shopDetails.type}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Shop Name</h3>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter shop name"
                            value={shopDetails.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Shopkeeper</h3>
                        <input
                            type="text"
                            name="keeper"
                            placeholder="Enter shopkeeper's name"
                            value={shopDetails.keeper}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Location</h3>
                        <input
                            type="text"
                            name="location"
                            placeholder="Enter location"
                            value={shopDetails.location}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Shopkeeper Description</h3>
                        <input
                            type="text"
                            name="shopkeeperDescription"
                            placeholder="Enter shopkeeper description"
                            value={shopDetails.shopkeeperDescription}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Shop Details</h3>
                        <input
                            type="text"
                            name="shopDetails"
                            placeholder="Enter shop details"
                            value={shopDetails.shopDetails}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="detail-section">
                        <h3>Shopkeeper Details</h3>
                        <input
                            type="text"
                            name="shopkeeperDetails"
                            placeholder="Enter shopkeeper details"
                            value={shopDetails.shopkeeperDetails}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="shop-actions">
                    <button 
                        className="action-button" 
                        onClick={saveShopToFirebase} 
                        disabled={!areAllDetailsFilled()}
                    >
                        Save Shop
                    </button>
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
