import PropTypes from 'prop-types';
import './CloneShopButton.css';

/**
 * CloneShopButton Component
 * 
 * A button component that creates a clone of the current shop with a new ID.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClone - Callback function to handle shop cloning
 * @param {string} props.shopId - Current shop ID for display
 */
const CloneShopButton = ({ onClone, shopId }) => {
    return (
        <div className="clone-button-container">
            <button 
                className="clone-shop-button"
                onClick={onClone}
                aria-label="Clone shop"
            >
                <span className="clone-icon">⧉</span>
                <span className="clone-text">Clone Shop</span>
            </button>
            {shopId && <span className="shop-id">ID: {shopId}</span>}
        </div>
    );
};

CloneShopButton.propTypes = {
    onClone: PropTypes.func.isRequired,
    shopId: PropTypes.string
};

export default CloneShopButton; 