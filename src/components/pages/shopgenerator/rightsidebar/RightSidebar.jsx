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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import PropTypes from 'prop-types';
import { importShop, exportShop } from '../utils/importExportShop';
import { loadSavedShops } from '../utils/firebaseShopUtils';
import SavedShopsSection from './selectshoptab/SavedShopsSection';
import ShopDetailsSection from './shopdetailstab/ShopDetailsSection';
import ImportExportSection from './selectshoptab/ImportExportSection';
import ActionButtonsSection from './shopdetailstab/ActionButtonsSection';
import TabArea from './TabArea';

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

function RightSidebar({ onSave, onLoad }) {
    const { currentUser, loading } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONSTRAINTS.DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [savedShops, setSavedShops] = useState([]);
    const [shopDetails, setShopDetails] = useState(INITIAL_SHOP_DETAILS);
    const [expandedFields, setExpandedFields] = useState({});
    const [activeTab, setActiveTab] = useState('chooseShop'); // State to track active tab

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
            loadSavedShops(currentUser.uid)
                .then(shops => setSavedShops(shops))
                .catch(error => console.error('Error loading shops:', error));
        }
    }, [currentUser, loading]);

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
        const newWidth = Math.max(SIDEBAR_CONSTRAINTS.MIN_WIDTH, Math.min(SIDEBAR_CONSTRAINTS.MAX_WIDTH, width));
        
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
            loadSavedShops(currentUser.uid)
                .then(shops => setSavedShops(shops))
                .catch(error => console.error('Error loading shops:', error));
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
            await exportShop(shopData);
            alert('Shop exported successfully!');
        } catch (error) {
            console.error('Error exporting shop:', error);
            alert('Error exporting shop. Please try again.');
        }
    };

    // Function to handle shop import
    const handleImportShop = async (event) => {
        try {
            const importedData = await importShop(event.target.files[0]);
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
            alert('Shop imported successfully!');
        } catch (error) {
            console.error('Error importing shop:', error);
            alert(error.message || 'Error importing shop. Please check the file and try again.');
        }
    };

    const renderTabContent = () => {
        if (activeTab === 'chooseShop') {
            return (
                <>
                    <SavedShopsSection 
                        savedShops={savedShops} 
                        shopDetails={shopDetails} 
                        loadShop={loadShop} 
                        handleNewShop={handleNewShop} 
                    />
                    <ImportExportSection 
                        handleImportShop={handleImportShop} 
                        handleExportShop={handleExportShop} 
                    />
                </>
            );
        } else if (activeTab === 'shopDetails') {
            return (
                <>
                    <ActionButtonsSection 
                        onGenerate={() => {}} // Placeholder for generate function
                        onSave={saveShopToFirebase} 
                        areAllDetailsFilled={areAllDetailsFilled} 
                    />
                    <ShopDetailsSection 
                        shopDetails={shopDetails} 
                        renderInputField={renderInputField} 
                    />
                </>
            );
        }
    };

    return (
        <div 
            className="right-sidebar" 
            ref={sidebarRef}
            style={{ width: sidebarWidth }}
        >
            <TabArea activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="right-sidebar-content scrollable">
                {renderTabContent()}
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
