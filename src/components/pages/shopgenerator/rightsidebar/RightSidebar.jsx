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

// Define which fields should be multiline
const MULTILINE_FIELDS = ['shopkeeperDescription', 'shopDetails', 'shopkeeperDetails'];

// Sidebar size constraints
const SIDEBAR_CONSTRAINTS = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 500,
    DEFAULT_WIDTH: 300
};

// Function to encode shop data into a shareable code
const encodeShopData = (shopData) => {
    console.log('Encoding shop data:', shopData);
    const dataToEncode = {
        // Shop details
        type: shopData.type,
        name: shopData.name,
        keeper: shopData.keeper,
        location: shopData.location,
        shopkeeperDescription: shopData.shopkeeperDescription,
        shopDetails: shopData.shopDetails,
        shopkeeperDetails: shopData.shopkeeperDetails,
        // Shop parameters
        goldAmount: shopData.goldAmount,
        levelRange: shopData.levelRange,
        shopBias: shopData.shopBias,
        rarityDistribution: shopData.rarityDistribution,
        // Categories and traits
        categories: shopData.categories,
        subcategories: shopData.subcategories,
        traits: shopData.traits,
        // Current stock
        currentStock: shopData.currentStock
    };
    console.log('Data being encoded:', dataToEncode);
    return btoa(JSON.stringify(dataToEncode));
};

// Function to decode shop data from a shareable code
const decodeShopData = (code) => {
    try {
        const decodedData = JSON.parse(atob(code));
        console.log('Decoded shop data:', decodedData);
        return decodedData;
    } catch (error) {
        console.error('Error decoding shop data:', error);
        return null;
    }
};

function RightSidebar({ onSave, onLoad }) {
    const { currentUser, loading } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONSTRAINTS.DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [savedShops, setSavedShops] = useState([]);
    const [shopDetails, setShopDetails] = useState(INITIAL_SHOP_DETAILS);
    const [expandedFields, setExpandedFields] = useState({});
    const [importCode, setImportCode] = useState('');

    // Debug logging for auth state changes
    useEffect(() => {
        console.log('Auth state changed:', { 
            isAuthenticated: !!currentUser,
            uid: currentUser?.uid,
            email: currentUser?.email,
            loading,
            providerData: currentUser?.providerData
        });
    }, [currentUser, loading]);

    // Load saved shops when component mounts
    useEffect(() => {
        console.log('Load shops effect triggered:', { 
            isAuthenticated: !!currentUser,
            isLoading: loading,
            uid: currentUser?.uid 
        });
        if (!loading && currentUser) {
            loadSavedShops();
        }
    }, [currentUser, loading]);

    // Function to load saved shops from Firebase
    const loadSavedShops = async () => {
        if (!currentUser) {
            console.log('No user authenticated, skipping load');
            return;
        }
        try {
            console.log('Starting to load shops:', {
                uid: currentUser.uid,
                path: `users/${currentUser.uid}/shops`
            });
            const shopsRef = collection(db, `users/${currentUser.uid}/shops`);
            console.log('Collection reference created');
            const shopsSnapshot = await getDocs(shopsRef);
            console.log('Got shops snapshot:', {
                empty: shopsSnapshot.empty,
                size: shopsSnapshot.size
            });
            const shops = [];
            shopsSnapshot.forEach((doc) => {
                shops.push({ id: doc.id, ...doc.data() });
            });
            console.log('Processed shops:', {
                count: shops.length,
                names: shops.map(s => s.name)
            });
            setSavedShops(shops);
        } catch (error) {
            console.error('Error loading shops:', {
                code: error.code,
                message: error.message,
                name: error.name,
                stack: error.stack
            });
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
        onLoad(shop);  // Pass the full shop data to parent
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

    // Function to create a new shop
    const handleNewShop = () => {
        setShopDetails(INITIAL_SHOP_DETAILS);
        setExpandedFields({});
        // Pass empty shop data to parent to reset everything
        onLoad({
            type: '',
            name: '',
            keeper: '',
            location: '',
            shopkeeperDescription: '',
            shopDetails: '',
            shopkeeperDetails: '',
            goldAmount: 5000,
            levelRange: { low: 0, high: 10 },
            shopBias: { x: 0.5, y: 0.5 },
            rarityDistribution: {
                Common: 95.00,
                Uncommon: 4.50,
                Rare: 0.49,
                Unique: 0.01
            },
            categories: {},
            subcategories: {},
            traits: {},
            currentStock: []
        });
    };

    // Function to toggle field expansion
    const toggleFieldExpansion = (fieldName) => {
        setExpandedFields(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    // Modified input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShopDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    // Function to render input field based on type
    const renderInputField = (key) => {
        const isMultiline = MULTILINE_FIELDS.includes(key);
        const isExpanded = expandedFields[key];
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

        if (isMultiline) {
            return (
                <div className={`multiline-field ${isExpanded ? 'expanded' : ''}`}>
                    <h3>
                        {label}
                        <button
                            className="toggle-expand"
                            onClick={() => toggleFieldExpansion(key)}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
                        >
                            {isExpanded ? '▼' : '▲'}
                        </button>
                    </h3>
                    <textarea
                        name={key}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        value={shopDetails[key]}
                        onChange={handleInputChange}
                        aria-label={label}
                    />
                </div>
            );
        }

        return (
            <>
                <h3>{label}</h3>
                <input
                    type="text"
                    name={key}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={shopDetails[key]}
                    onChange={handleInputChange}
                    aria-label={label}
                />
            </>
        );
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

    // Function to handle shop export
    const handleExportShop = async () => {
        try {
            const shopData = await onSave(shopDetails);
            const exportCode = encodeShopData(shopData);
            console.log('Generated export code:', exportCode);
            // Copy to clipboard
            await navigator.clipboard.writeText(exportCode);
            alert('Shop code copied to clipboard!');
        } catch (error) {
            console.error('Error exporting shop:', error);
            alert('Error exporting shop. Please try again.');
        }
    };

    // Function to handle shop import
    const handleImportShop = () => {
        try {
            const importedData = decodeShopData(importCode);
            if (!importedData) {
                alert('Invalid shop code. Please check and try again.');
                return;
            }
            onLoad(importedData);
            setShopDetails({
                type: importedData.type || '',
                name: importedData.name || '',
                keeper: importedData.keeper || '',
                location: importedData.location || '',
                shopkeeperDescription: importedData.shopkeeperDescription || '',
                shopDetails: importedData.shopDetails || '',
                shopkeeperDetails: importedData.shopkeeperDetails || ''
            });
            setImportCode('');
            alert('Shop imported successfully!');
        } catch (error) {
            console.error('Error importing shop:', error);
            alert('Error importing shop. Please check the code and try again.');
        }
    };

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
                    <button 
                        className="new-shop-button"
                        onClick={handleNewShop}
                        aria-label="Create New Shop"
                    >
                        New Shop
                    </button>
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
                            {renderInputField(key)}
                        </div>
                    ))}
                </div>

                <button 
                    className="action-button" 
                    onClick={saveShopToFirebase} 
                    disabled={!areAllDetailsFilled()}
                    aria-label="Save Shop"
                >
                    Save Shop
                </button>

                {/* Import/Export Section */}
                <div className="shop-import-export">
                    <h3>Import/Export Shop</h3>
                    <div className="import-export-actions">
                        <button 
                            className="action-button"
                            onClick={handleExportShop}
                            aria-label="Export Shop"
                        >
                            Export Shop
                        </button>
                        <div className="import-section">
                            <input
                                type="text"
                                value={importCode}
                                onChange={(e) => setImportCode(e.target.value)}
                                placeholder="Paste shop code here"
                                aria-label="Import shop code"
                            />
                            <button 
                                className="action-button"
                                onClick={handleImportShop}
                                disabled={!importCode}
                                aria-label="Import Shop"
                            >
                                Import
                            </button>
                        </div>
                    </div>
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
