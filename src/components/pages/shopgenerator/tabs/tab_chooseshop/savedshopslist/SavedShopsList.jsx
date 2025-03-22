// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../../shared/scrollbar/Scrollbar';
import './SavedShopsList.css';

const SavedShopsList = ({ savedShops, loadShop, currentShopId, onDeleteShops, onExportShops, isLoadingShop }) => {
    const [selectedShops, setSelectedShops] = useState([]);
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [sortBy, setSortBy] = useState('dateLastEdited');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const containerRef = useRef(null);
    const tableRef = useRef(null);
    const [hasFocus, setHasFocus] = useState(false);
    
    // Reset selection when shops change
    useEffect(() => {
        setSelectedShops([]);
    }, [savedShops]);

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

    // Compact date format for narrower containers
    const formatCompactDate = (date) => {
        if (!date) return '';
        
        // Handle Firebase Timestamp objects
        if (date && typeof date === 'object' && date.toDate) {
            date = date.toDate();
        }
        
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'Invalid';
        
        // Always show MM/DD/YY with 2-digit year
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
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
        // Don't process selection when loading
        if (isLoadingShop) return;
        
        const shopToLoad = savedShops.find(shop => shop.id === shopId);
        
        // Simple click without modifiers - just load the shop
        if (!event || (!event.shiftKey && !event.ctrlKey && !event.metaKey)) {
            // Always load the shop on simple click
            if (shopToLoad) {
                loadShop(shopToLoad);
            }
            
            // Always clear selections and reset the starting point
            setSelectedShops([]);
            setLastSelectedIndex(index);
            return;
        }
        
        // For multi-select operations with shift key
        if (event && event.shiftKey) {
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
        else if (event && (event.ctrlKey || event.metaKey)) {
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

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!hasFocus || sortedShops.length === 0 || isLoadingShop) return;
        
        // Get current index (either the last selected or find the current shop)
        let currentIndex = lastSelectedIndex;
        if (currentIndex === null && currentShopId) {
            currentIndex = sortedShops.findIndex(shop => shop.id === currentShopId);
        }
        
        let newIndex = currentIndex;
        
        // Handle arrow keys for navigation
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Select next shop if not at end of list
            newIndex = currentIndex < sortedShops.length - 1 
                ? currentIndex + 1 
                : currentIndex;
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Select previous shop if not at start of list
            newIndex = currentIndex > 0 
                ? currentIndex - 1 
                : 0;
        }
        
        // If index has changed, select the new shop
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sortedShops.length) {
            handleSelectShop(sortedShops[newIndex].id, newIndex, null);
            
            // Make sure the selected item is visible
            const shopElements = tableRef.current?.querySelectorAll('.shop-row');
            if (shopElements && shopElements[newIndex]) {
                shopElements[newIndex].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }
        }
    }, [hasFocus, lastSelectedIndex, currentShopId, sortedShops, handleSelectShop, isLoadingShop]);

    // Add event listeners for focus and keyboard events
    useEffect(() => {
        const table = tableRef.current;
        if (!table) return;

        const handleFocus = () => setHasFocus(true);
        const handleBlur = () => setHasFocus(false);
        
        table.addEventListener('focus', handleFocus);
        table.addEventListener('blur', handleBlur);
        table.addEventListener('keydown', handleKeyDown);
        
        return () => {
            table.removeEventListener('focus', handleFocus);
            table.removeEventListener('blur', handleBlur);
            table.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

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
            className={`saved-shops-list-container ${isLoadingShop ? 'loading' : ''}`}
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
                        disabled={selectedShops.length === 0 && !currentShopId}
                    >
                        Export
                    </button>
                    <button 
                        className="shop-action-button shop-action-delete" 
                        onClick={handleDeleteSelected}
                        title="Delete selected shops"
                        disabled={selectedShops.length === 0 && !currentShopId}
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
                <div 
                    className="shop-col shop-col-type clickable" 
                    onClick={() => handleSort('type')}
                >
                    Type {getSortIcon('type')}
                </div>
                <div 
                    className="shop-col shop-col-date clickable" 
                    onClick={() => handleSort('dateLastEdited')}
                >
                    <span className="header-text">Modified</span> {getSortIcon('dateLastEdited')}
                </div>
            </div>
            
            <Scrollbar className="shops-scrollbar">
                <div 
                    ref={tableRef}
                    className="saved-shops-table" 
                    tabIndex="0"
                >
                    {showNewUnsavedShop && (
                        <div className="shop-row shop-row-current shop-row-unsaved">
                            <div className="shop-col shop-col-name">
                                <span className="shop-name-text">New Unsaved Shop</span> <span className="unsaved-indicator">*</span>
                            </div>
                            <div className="shop-col shop-col-type">
                                <span className="shop-type-text">-</span>
                            </div>
                            <div className="shop-col shop-col-date">
                                <span className="date-full">Just now</span>
                                <span className="date-compact">{`${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear().toString().slice(-2)}`}</span>
                            </div>
                        </div>
                    )}
                    
                    {sortedShops.map((shop, index) => (
                        <div 
                            key={shop.id} 
                            onClick={(e) => handleSelectShop(shop.id, index, e)}
                            className={`shop-row ${shop.id === currentShopId ? 'shop-row-current' : ''} ${selectedShops.includes(shop.id) ? 'shop-row-selected' : ''}`}
                            title={`${shop.name || 'Unnamed Shop'}\nType: ${shop.type || '-'}\nLocation: ${shop.location || '-'}\nShopkeeper: ${shop.keeperName || '-'}\nLast modified: ${formatDate(shop.dateLastEdited)}`}
                        >
                            <div className="shop-col shop-col-name">
                                <span className="shop-name-text">{shop.name || 'Unnamed Shop'}</span>
                            </div>
                            <div className="shop-col shop-col-type">
                                <span className="shop-type-text">{shop.type || '-'}</span>
                            </div>
                            <div className="shop-col shop-col-date">
                                <span className="date-full">{formatDate(shop.dateLastEdited)}</span>
                                <span className="date-compact">{formatCompactDate(shop.dateLastEdited)}</span>
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