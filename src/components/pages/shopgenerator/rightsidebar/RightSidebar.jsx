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
import PropTypes from 'prop-types';
import SavedShops from './selectshoptab/SavedShops';
import ShopDetailsShort from './shopdetailstab/shopdetailsshort/ShopDetailsShort';
import ShopDetailsLong from './shopdetailstab/ShopDetailsLong';
import ImportExport from './selectshoptab/ImportExport';
import TabArea from './TabArea';
import SaveShopButton from './shopdetailstab/SaveShopButton';
import { loadShopData } from '../utils/firebaseShopUtils';
import { exportShopData } from '../utils/shopFileUtils';

// Initial shop details state
const INITIAL_SHOP_DETAILS = {
    shortData: {
        shopName: '',
        shopKeeperName: '',
        type: '',
        location: ''
    },
    longData: {
        shopDetails: '',
        shopkeeperDetails: ''
    },
    parameters: {
        goldAmount: 5000,
        levelLow: 0,
        levelHigh: 10,
        shopBias: { x: 50.00, y: 50.00 },
        rarityDistribution: {
            common: 95.00,
            uncommon: 4.00,
            rare: 0.90,
            unique: 0.10
        },
        categories: [],
        subcategories: [],
        traits: [],
        currentStock: []
    },
    id: '',
    dateCreated: new Date(),
    dateLastEdited: new Date()
};


// Sidebar size constraints
const SIDEBAR_CONSTRAINTS = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 500,
    DEFAULT_WIDTH: 300
};

function RightSidebar({ onSave }) {
    const { currentUser, loading } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONSTRAINTS.DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [savedShops, setSavedShops] = useState([]); // The list of saved shops
    const [shopDetails, setShopDetails] = useState(INITIAL_SHOP_DETAILS);
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
            loadSavedShops();
        }
    }, [currentUser, loading]);

 

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



    // Modified input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShopDetails(prevDetails => {
            if (name in prevDetails.shortData) {
                return {
                    ...prevDetails,
                    shortData: {
                        ...prevDetails.shortData,
                        [name]: value
                    }
                };
            } else if (name in prevDetails.longData) {
                return {
                    ...prevDetails,
                    longData: {
                        ...prevDetails.longData,
                        [name]: value
                    }
                };
            }
            return prevDetails;
        });
    };

    // Function to check if all shop details are filled
    const areAllDetailsFilled = useCallback(() => {
        const checkDataFilled = (data) => {
            return Object.values(data).every(value => value && typeof value === 'string' && value.trim() !== '');
        };
        return checkDataFilled(shopDetails.shortData) && checkDataFilled(shopDetails.longData);
    }, [shopDetails]);


    // Function to create a new shop
    const handleNewShop = () => {
        setShopDetails(INITIAL_SHOP_DETAILS);
    };

   // Function to load saved shops from Firebase
   const loadSavedShops = async () => {
     try {
        const userId = currentUser.uid;
        const shops = await loadShopData(userId);
        console.log('Loaded shops:', shops); // Debug log
        setSavedShops(shops);
    } catch (error) {
        console.error('Error loading shops:', error);
    }
   };

   // Function to load a specific shop
   const loadShop = (shop) => {
      setShopDetails(shop);
   };

    // Function to handle shop import
    const handleImportShop = (importedData) => {
        console.log('Imported data:', importedData); // Debug log
        setShopDetails(importedData);
    };

    // Function to handle shop export
    const handleExportShop = () => {
        exportShopData(shopDetails);
    };

    const renderTabContent = () => {
        if (activeTab === 'chooseShop') {
            return (
                <>
                    <SavedShops
                        savedShops={savedShops} 
                        shopDetails={shopDetails} 
                        loadShop={loadShop} 
                        handleNewShop={handleNewShop} 
                    />
                    <ImportExport 
                        handleImportShop={handleImportShop} 
                        handleExportShop={handleExportShop} 
                        shopData={shopDetails} 
                    />
                </>
            );
        } else if (activeTab === 'shopDetails') {
            return (
                <>
                    <SaveShopButton
                        onSave={onSave}
                        areAllDetailsFilled={areAllDetailsFilled}
                    />
                    <ShopDetailsShort 
                        shopDetails={shopDetails} 
                        onInputChange={handleInputChange}
                    />
                    <ShopDetailsLong 
                        shopDetails={shopDetails} 
                        onInputChange={handleInputChange}
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
};

export default RightSidebar;
