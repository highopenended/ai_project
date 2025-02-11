/**
 * RightSidebar component for managing shop details and saved shops.
 * Provides functionality to save, load, and edit shop information.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onSave - Callback function when saving a shop
 * @param {Function} props.onLoad - Callback function when loading a shop
 * @param {Function} props.onNewShop - Callback function when creating a new shop
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import './RightSidebar.css';
import { useAuth } from "../../../../context/AuthContext";
import PropTypes from 'prop-types';
import SavedShops from '../../shopgenerator/tabs/tab_chooseshop/SavedShops';
import NewShopButton from '../../shopgenerator/tabs/tab_chooseshop/NewShopButton';
import ShopDetailsShort from './shopdetailstab/shopdetailsshort/ShopDetailsShort';
import ShopDetailsLong from './shopdetailstab/ShopDetailsLong';
import ImportExport from '../../shopgenerator/tabs/tab_chooseshop/ImportExport';
import TabArea from './TabArea';
import SaveShopButton from './shopdetailstab/SaveShopButton';
import CloneShopButton from './shopdetailstab/CloneShopButton';
import ShopDates from './shopdetailstab/ShopDates';
import { exportShopData } from '../utils/shopFileUtils';

// Sidebar size constraints
const SIDEBAR_CONSTRAINTS = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 500,
    DEFAULT_WIDTH: 300
};

function RightSidebar({ onSave, savedShops, currentShop, onShopDetailsChange, onLoadShop, onNewShop }) {
    const { currentUser, loading } = useAuth();
    const sidebarRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONSTRAINTS.DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startWidth: 0 });
    const [activeTab, setActiveTab] = useState('chooseShop');

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

    // Function to check if all shop details are filled
    const areAllDetailsFilled = useCallback(() => {
        const checkDataFilled = (data) => {
            return Object.values(data).every(value => value && typeof value === 'string' && value.trim() !== '');
        };
        return checkDataFilled(currentShop.shortData) && checkDataFilled(currentShop.longData);
    }, [currentShop]);

    // Function to create a new shop
    const handleNewShop = () => {
        onNewShop(); // Call parent's reset function
        setActiveTab('shopDetails');
    };

    // Function to handle loading a shop
    const handleLoadShop = (shop) => {
        console.log('Loading shop in RightSidebar:', shop);  // Debug log
        onLoadShop(shop);  // Call the parent's load function
        setActiveTab('shopDetails');  // Switch to details tab
    };

    // Function to handle shop import
    const handleImportShop = (importedData) => {
        console.log('Imported data:', importedData);
        setActiveTab('shopDetails');
    };

    // Function to handle shop export
    const handleExportShop = () => {
        exportShopData(currentShop);
    };

    // Function to handle cloning a shop
    const handleCloneShop = () => {
        const { id, ...shopWithoutId } = currentShop; // Remove the ID from the current shop
        const clonedShop = {
            ...shopWithoutId,
            dateCreated: new Date(),
            dateLastEdited: new Date(),
            shortData: {
                ...currentShop.shortData,
                shopName: `${currentShop.shortData.shopName} (Clone)`
            }
        };
        onLoadShop(clonedShop);
    };

    const renderTabContent = () => {
        if (activeTab === 'chooseShop') {
            return (
                <>
                    <NewShopButton handleNewShop={handleNewShop} />
                    <SavedShops
                        savedShops={savedShops} 
                        loadShop={handleLoadShop} 
                        handleNewShop={handleNewShop} 
                    />
                    <ImportExport 
                        handleImportShop={handleImportShop} 
                        handleExportShop={handleExportShop} 
                        shopData={currentShop} 
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
                    <CloneShopButton
                        onClone={handleCloneShop}
                        shopId={currentShop.id}
                    />
                    <ShopDetailsShort 
                        shopDetails={currentShop} 
                        onInputChange={onShopDetailsChange}
                    />
                    <ShopDetailsLong 
                        shopDetails={currentShop} 
                        onInputChange={onShopDetailsChange}
                    />
                    <ShopDates
                        dateCreated={currentShop.dateCreated}
                        dateLastEdited={currentShop.dateLastEdited}
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
    savedShops: PropTypes.array.isRequired,
    currentShop: PropTypes.object.isRequired,
    onShopDetailsChange: PropTypes.func.isRequired,
    onLoadShop: PropTypes.func.isRequired,
    onNewShop: PropTypes.func.isRequired,
};

export default RightSidebar;
