import PropTypes from 'prop-types';
import './CurrentShopSummary.css';

function CurrentShopSummary({ currentShopName }) { 
    return (
        <div className="current-shop-summary">
            <h2 className="shop-title">{currentShopName}</h2>
        </div>
    );
}

CurrentShopSummary.propTypes = {
    currentShopName: PropTypes.string.isRequired,
};

export default CurrentShopSummary;