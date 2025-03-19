import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../../shared/scrollbar/Scrollbar';
import './SavedShopsList.css';

const SavedShopsList = ({ savedShops, loadShop, currentShopId, onDeleteShops, onExportShops }) => {
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
        // Simple click without modifiers - just load the shop, no multi-select
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            loadShop(savedShops.find(shop => shop.id === shopId));
            // Always clear selections and reset the starting point
            setSelectedShops([]);
            setLastSelectedIndex(index);
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
        
        // Ctrl/Cmd + Click support (optional, can be removed if not wanted)
        else if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            
            if (selectedShops.length === 0) {
                // First selection with Ctrl/Cmd
                setSelectedShops([shopId]);
                setLastSelectedIndex(index);
            } else {
                // Toggle selection with Ctrl/Cmd
                setSelectedShops(prev => 
                    prev.includes(shopId) 
                        ? prev.filter(id => id !== shopId)
                        : [...prev, shopId]
                );
                setLastSelectedIndex(index);
            }
        }
    }, [loadShop, savedShops, lastSelectedIndex, sortedShops, selectedShops]);

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
        setShowConfirmDelete(true);
    };

    const confirmDelete = () => {
        if (onDeleteShops && selectedShops.length > 0) {
            onDeleteShops(selectedShops);
        }
        setShowConfirmDelete(false);
        setSelectedShops([]);
    };

    const handleExportSelected = () => {
        if (onExportShops && selectedShops.length > 0) {
            const shopsToExport = savedShops.filter(shop => selectedShops.includes(shop.id));
            onExportShops(shopsToExport);
        }
    };

    // Get icon for sorting
    const getSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    // Add a function to cancel selection
    const cancelSelection = () => {
        setSelectedShops([]);
        setLastSelectedIndex(null);
    };

    return (
        <div 
            ref={containerRef}
            className={`saved-shops-list-container ${isNarrow ? 'narrow-container' : ''}`}
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
                    {selectedShops.length > 0 && (
                        <>
                            <button 
                                className="shop-action-button shop-action-cancel" 
                                onClick={cancelSelection}
                                title="Cancel selection"
                            >
                                Cancel
                            </button>
                            <button 
                                className="shop-action-button shop-action-export" 
                                onClick={handleExportSelected}
                                title="Export selected shops"
                            >
                                Export
                            </button>
                            <button 
                                className="shop-action-button shop-action-delete" 
                                onClick={handleDeleteSelected}
                                title="Delete selected shops"
                            >
                                Delete
                            </button>
                        </>
                    )}
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
                        <h3 className="delete-confirm-title">Delete {selectedShops.length} Shop{selectedShops.length > 1 ? 's' : ''}?</h3>
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
    onExportShops: PropTypes.func
};

export default SavedShopsList; 