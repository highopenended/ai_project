// import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../shared/Section';
import Scrollbar from '../../shared/Scrollbar';
import './SavedShops.css';

const SavedShops = ({ savedShops, loadShop }) => {
    console.log('SavedShops data:', savedShops); // Debug log
    return (
        <Section title="Saved Shops">           
            <Scrollbar style={{ maxHeight: '200px', minHeight: '100px', overflowY: 'auto' }}>
                <ul className="shop-list">
                    {savedShops.map((shop) => (
                        <li key={shop.id} onClick={() => loadShop(shop)} className="shop-item">
                            {shop.shortData.shopName || 'Unnamed Shop'}
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