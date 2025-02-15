// import React from 'react';
import PropTypes from 'prop-types';
import Scrollbar from '../../shared/Scrollbar';
import './SavedShops.css';

const SavedShops = ({ savedShops, loadShop }) => {
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

    return (
        <div className="saved-shops-container">
            <div className="saved-shops-title">Saved Shops</div>
            <Scrollbar style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ul className="shop-list">
                    {savedShops.map((shop) => (
                        <li 
                            key={shop.id} 
                            onClick={() => loadShop(shop)} 
                            className="shop-item"
                            title={`Last edited: ${formatDate(shop.dateLastEdited)}`}
                        >
                            <span className="shop-item-name">
                                {shop.shortData.shopName || 'Unnamed Shop'}
                            </span>
                            <span className="shop-item-date">
                                {formatDate(shop.dateLastEdited)}
                            </span>
                        </li>
                    ))}
                    {savedShops.length === 0 && (
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

SavedShops.propTypes = {
    savedShops: PropTypes.array.isRequired,
    loadShop: PropTypes.func.isRequired,
};

export default SavedShops; 