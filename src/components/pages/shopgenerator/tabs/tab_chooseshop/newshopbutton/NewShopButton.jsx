import PropTypes from 'prop-types';
import './NewShopButton.css';

/**
 * NewShopButton Component
 * 
 * A button component that triggers the creation of a new shop.
 * Positioned above the SavedShops list in the Choose Shop tab.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.handleNewShop - Callback function to handle new shop creation
 * @param {boolean} [props.disabled=false] - Whether the button should be disabled
 */
const NewShopButton = ({ handleNewShop, disabled = false }) => {
    return (
        <button 
            className="new-shop-button"
            onClick={handleNewShop}
            aria-label="Create new shop"
            disabled={disabled}
        >
            <span className="new-shop-icon">+</span>
            <span className="new-shop-text">New Shop</span>
        </button>
    );
};

NewShopButton.propTypes = {
    handleNewShop: PropTypes.func.isRequired,
    disabled: PropTypes.bool
};

export default NewShopButton; 