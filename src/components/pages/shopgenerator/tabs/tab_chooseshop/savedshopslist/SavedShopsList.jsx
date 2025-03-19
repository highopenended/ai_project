// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../../shared/scrollbar/Scrollbar';
import './SavedShopsList.css';

const SavedShopsList = ({ savedShops, loadShop, currentShopId, onDeleteShops, onExportShops, isLoadingShop = false }) => {
    const [selectedShops, setSelectedShops] = useState([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [sortBy, setSortBy] = useState('dateLastEdited');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [isNarrow, setIsNarrow] = useState(false);
    const containerRef = useRef(null);
    
    // Reset selection when shops change
    useEffect(() => {
        setSelectedShops([]);
    }, [savedShops]);

    // Check and update container width
    useEffect(() => {
        if (!containerRef.current) return;
        
        const checkWidth = () => {
            const width = containerRef.current?.clientWidth || 0;
            setIsNarrow(width < 380); // Adjusted threshold to 380px for better spacing
        };
        
        // Initial check
        checkWidth();
        
        // Set up resize observer to check width on container resize
        const resizeObserver = new ResizeObserver(checkWidth);
        resizeObserver.observe(containerRef.current);
        
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const formatDate = (date) => {
        if (!date) return '';
        
        // Handle Firebase Timestamp objects
        if (date && typeof date === 'object' && date.toDate) {
            date = date.toDate();
        }
        
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Sort shops based on current sort criteria
    const sortedShops = [...savedShops].sort((a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'name') {
            valueA = (a.name || 'Unnamed Shop').toLowerCase();
            valueB = (b.name || 'Unnamed Shop').toLowerCase();
            return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } 
        else if (sortBy === 'type') {
            valueA = (a.type || '').toLowerCase();
            valueB = (b.type || '').toLowerCase();
            return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        else if (sortBy === 'dateLastEdited') {
            // Handle Firebase Timestamp objects
            if (a.dateLastEdited?.toDate) valueA = a.dateLastEdited.toDate().getTime();
            else valueA = new Date(a.dateLastEdited).getTime();
            
            if (b.dateLastEdited?.toDate) valueB = b.dateLastEdited.toDate().getTime();
            else valueB = new Date(b.dateLastEdited).getTime();
            
            return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        }
        return 0;
    });

    // Shows unsaved shop at top if applicable
    const showNewUnsavedShop = currentShopId?.startsWith('shop_') && 
        !savedShops.find(shop => shop.id === currentShopId);

    // Handle selecting a shop
    const handleSelectShop = useCallback((shopId, index, event) => {
        // Prevent interactions while loading a shop
        if (isLoadingShop) return;

        const shopToLoad = savedShops.find(shop => shop.id === shopId);
        
        // Simple click without modifiers - just load the shop
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            // Set last selected index and clear selections immediately for responsive UI
            setLastSelectedIndex(index);
            setSelectedShops([]);
            
            // Load the shop (will happen asynchronously)
            if (shopToLoad) {
                loadShop(shopToLoad);
            }
            return;
        }
        
        // For multi-select operations with shift key
        if (event.shiftKey) {
            event.preventDefault();
            
            if (lastSelectedIndex === null) {
                // If no previous selection, start with current shop
                setLastSelectedIndex(index);
                setSelectedShops([shopId]);
                return;
            }
            
            // Shift + Click: Select range from last clicked to current
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const rangeShops = sortedShops.slice(start, end + 1).map(shop => shop.id);
            
            setSelectedShops(rangeShops);
        }
        
        // Ctrl/Cmd + Click support for individual shop toggling
        else if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            
            // Toggle the clicked shop in/out of the selection
            setSelectedShops(prev => {
                let newSelection = [...prev];
                
                // If this is the first Ctrl+click and there's a current shop,
                // include the current shop in the selection if it's not the one being clicked
                if (newSelection.length === 0 && currentShopId && currentShopId !== shopId) {
                    newSelection.push(currentShopId);
                }
                
                // Check if the shop is already selected
                const isSelected = newSelection.includes(shopId);
                
                if (isSelected) {
                    // If already selected, remove it
                    return newSelection.filter(id => id !== shopId);
                } else {
                    // If not selected, add it
                    return [...newSelection, shopId];
                }
            });
            
            // Update last selected index
            setLastSelectedIndex(index);
        }
    }, [loadShop, savedShops, lastSelectedIndex, sortedShops, currentShopId, isLoadingShop]);

    // Toggle sort order or change sort field
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Bulk operations
    const handleDeleteSelected = () => {
        // If nothing is explicitly selected but there's a current shop,
        // use the current shop for deletion
        if (selectedShops.length === 0 && currentShopId) {
            setSelectedShops([currentShopId]);
        }
        setShowConfirmDelete(true);
    };

    const confirmDelete = () => {
        // If we have explicitly selected shops, delete those
        if (selectedShops.length > 0 && onDeleteShops) {
            onDeleteShops(selectedShops);
        }
        // Otherwise if we have a current shop, delete that
        else if (currentShopId && onDeleteShops) {
            onDeleteShops([currentShopId]);
        }
        
        setShowConfirmDelete(false);
        setSelectedShops([]);
    };

    const handleExportSelected = () => {
        // If we have explicitly selected shops, export those
        if (selectedShops.length > 0 && onExportShops) {
            const shopsToExport = savedShops.filter(shop => selectedShops.includes(shop.id));
            onExportShops(shopsToExport);
        } 
        // Otherwise if we have a current shop, export that
        else if (currentShopId && onExportShops) {
            const currentShop = savedShops.find(shop => shop.id === currentShopId);
            if (currentShop) {
                onExportShops([currentShop]);
            }
        }
    };

    // Get icon for sorting
    const getSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    return (
        <div 
            ref={containerRef}
            className={`saved-shops-list-container ${isNarrow ? 'narrow-container' : ''} ${isLoadingShop ? 'loading-shop' : ''}`}
        >
            <div className="saved-shops-header">
                <div className="saved-shops-title">
                    {selectedShops.length > 0 ? (
                        <span className="selection-mode-indicator">
                            {selectedShops.length} Selected
                        </span>
                    ) : (
                        "Saved Shops"
                    )}
                </div>
                <div className="saved-shops-actions">
                    <button 
                        className="shop-action-button shop-action-export" 
                        onClick={handleExportSelected}
                        title="Export selected shops"
                        disabled={(selectedShops.length === 0 && !currentShopId) || isLoadingShop}
                    >
                        Export
                    </button>
                    <button 
                        className="shop-action-button shop-action-delete" 
                        onClick={handleDeleteSelected}
                        title="Delete selected shops"
                        disabled={(selectedShops.length === 0 && !currentShopId) || isLoadingShop}
                    >
                        Delete
                    </button>
                </div>
            </div>
            
            <div className="saved-shops-table-header">
                <div 
                    className="shop-col shop-col-name clickable" 
                    onClick={() => handleSort('name')}
                >
                    Name {getSortIcon('name')}
                </div>
                {!isNarrow && (
                    <div 
                        className="shop-col shop-col-type clickable" 
                        onClick={() => handleSort('type')}
                    >
                        Type {getSortIcon('type')}
                    </div>
                )}
                <div 
                    className="shop-col shop-col-date clickable" 
                    onClick={() => handleSort('dateLastEdited')}
                >
                    Modified {getSortIcon('dateLastEdited')}
                </div>
            </div>
            
            <Scrollbar className="shops-scrollbar">
                <div className="saved-shops-table">
                    {showNewUnsavedShop && (
                        <div className="shop-row shop-row-current shop-row-unsaved">
                            <div className="shop-col shop-col-name">
                                New Unsaved Shop <span className="unsaved-indicator">*</span>
                            </div>
                            {!isNarrow && <div className="shop-col shop-col-type">-</div>}
                            <div className="shop-col shop-col-date">Just now</div>
                        </div>
                    )}
                    
                    {sortedShops.map((shop, index) => (
                        <div 
                            key={shop.id} 
                            onClick={(e) => handleSelectShop(shop.id, index, e)}
                            className={`shop-row ${shop.id === currentShopId ? 'shop-row-current' : ''} ${selectedShops.includes(shop.id) ? 'shop-row-selected' : ''}`}
                            title={`${shop.name || 'Unnamed Shop'}${isNarrow ? '\nType: ' + (shop.type || '-') : ''}\nLocation: ${shop.location || '-'}\nShopkeeper: ${shop.keeperName || '-'}`}
                        >
                            <div className="shop-col shop-col-name">
                                {shop.name || 'Unnamed Shop'}
                            </div>
                            {!isNarrow && (
                                <div className="shop-col shop-col-type">
                                    {shop.type || '-'}
                                </div>
                            )}
                            <div className="shop-col shop-col-date">
                                {formatDate(shop.dateLastEdited)}
                            </div>
                        </div>
                    ))}
                    
                    {savedShops.length === 0 && !showNewUnsavedShop && (
                        <div className="shop-row shop-row-empty">
                            <div className="shop-col">No saved shops</div>
                        </div>
                    )}
                </div>
            </Scrollbar>

            {showConfirmDelete && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-dialogue">
                        <h3 className="delete-confirm-title">Delete {selectedShops.length === 1 ? "1 Shop" : `${selectedShops.length} Shops`}?</h3>
                        <p className="delete-confirm-message">
                            Are you sure you want to delete {selectedShops.length > 1 ? 'these shops' : 'this shop'}? This action cannot be undone.
                        </p>
                        <div className="delete-confirm-buttons">
                            <button 
                                className="delete-confirm-button delete-confirm-proceed"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                            <button 
                                className="delete-confirm-button delete-confirm-cancel"
                                onClick={() => setShowConfirmDelete(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

SavedShopsList.propTypes = {
    savedShops: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        keeperName: PropTypes.string,
        type: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
        keeperDescription: PropTypes.string,
        dateCreated: PropTypes.oneOfType([
            PropTypes.instanceOf(Date),
            PropTypes.string,
            PropTypes.object // For Firebase Timestamp
        ]).isRequired,
        dateLastEdited: PropTypes.oneOfType([
            PropTypes.instanceOf(Date),
            PropTypes.string,
            PropTypes.object // For Firebase Timestamp
        ]).isRequired,
        gold: PropTypes.number,
        levelRange: PropTypes.shape({
            min: PropTypes.number,
            max: PropTypes.number
        }),
        itemBias: PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number
        }),
        rarityDistribution: PropTypes.object,
        currentStock: PropTypes.array,
        filterStorageObjects: PropTypes.object
    })).isRequired,
    loadShop: PropTypes.func.isRequired,
    currentShopId: PropTypes.string,
    onDeleteShops: PropTypes.func,
    onExportShops: PropTypes.func,
    isLoadingShop: PropTypes.bool
};

export default SavedShopsList; 