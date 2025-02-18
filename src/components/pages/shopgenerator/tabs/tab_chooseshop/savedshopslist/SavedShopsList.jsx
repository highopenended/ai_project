// import React from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../../shared/scrollbar/Scrollbar';
import './SavedShopsList.css';

const SavedShopsList = ({ savedShops, loadShop, currentShopId }) => {
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

    // Check if current shop is unsaved (has ID but not in savedShops)
    const isUnsavedNew = currentShopId && !savedShops.find(shop => shop.id === currentShopId);

    return (
        <div className="saved-shops-list-container">
            <div className="saved-shops-title">Saved Shops</div>
            <Scrollbar style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ul className="shop-list">
                    {isUnsavedNew && (
                        <li className="shop-item shop-item-current shop-item-unsaved">
                            <span className="shop-item-name">
                                New Unsaved Shop
                                <span className="unsaved-indicator">*</span>
                            </span>
                            <span className="shop-item-date">
                                Just now
                            </span>
                        </li>
                    )}
                    {savedShops.map((shop) => (
                        <li 
                            key={shop.id} 
                            onClick={() => loadShop(shop)} 
                            className={`shop-item ${shop.id === currentShopId ? 'shop-item-current' : ''}`}
                            title={`Last edited: ${formatDate(shop.dateLastEdited)}`}
                        >
                            <span className="shop-item-name">
                                {shop.name || 'Unnamed Shop'}
                            </span>
                            <span className="shop-item-date">
                                {formatDate(shop.dateLastEdited)}
                            </span>
                        </li>
                    ))}
                    {savedShops.length === 0 && !isUnsavedNew && (
                        <li className="shop-item" style={{ justifyContent: 'center', cursor: 'default' }}>
                            <span className="shop-item-name" style={{ opacity: 0.7 }}>
                                No saved shops
                            </span>
                        </li>
                    )}
                </ul>
            </Scrollbar>
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
        filterStates: PropTypes.object
    })).isRequired,
    loadShop: PropTypes.func.isRequired,
    currentShopId: PropTypes.string
};

export default SavedShopsList; 