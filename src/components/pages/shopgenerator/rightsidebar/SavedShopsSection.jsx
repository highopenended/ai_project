// import React from 'react';
import PropTypes from 'prop-types';
import Section from '../components/Section';

const SavedShopsSection = ({ savedShops, shopDetails, loadShop, handleNewShop }) => {
    return (
        <Section title="Saved Shops">
            <button 
                className="new-shop-button"
                onClick={handleNewShop}
                aria-label="Create New Shop"
            >
                New Shop
            </button>
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
        </Section>
    );
};

SavedShopsSection.propTypes = {
    savedShops: PropTypes.array.isRequired,
    shopDetails: PropTypes.object.isRequired,
    loadShop: PropTypes.func.isRequired,
    handleNewShop: PropTypes.func.isRequired,
};

export default SavedShopsSection; 