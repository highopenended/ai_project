// import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../components/Section';
import Scrollbar from '../../components/Scrollbar';
import './SavedShops.css';

const SavedShops = ({ savedShops, loadShop, handleNewShop }) => {
    return (
        <Section title="">
            <button 
                className="action-button"
                onClick={handleNewShop}
                aria-label="Create New Shop"
            >
                CreateNew Shop
            </button>
            <Scrollbar style={{ maxHeight: '200px', minHeight: '100px', overflowY: 'auto' }}>
                <ul className="shop-list">
                    {savedShops.map((shop) => (
                        <li key={shop.name} onClick={() => loadShop(shop)} className="shop-item">
                            {shop.name}
                        </li>
                    ))}
                </ul>
            </Scrollbar>
        </Section>
    );
};

SavedShops.propTypes = {
    savedShops: PropTypes.array.isRequired,
    loadShop: PropTypes.func.isRequired,
    handleNewShop: PropTypes.func.isRequired,
};

export default SavedShops; 