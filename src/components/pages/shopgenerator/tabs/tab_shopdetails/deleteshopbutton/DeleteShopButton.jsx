import { useState } from 'react';
import PropTypes from 'prop-types';
import './DeleteShopButton.css';

const DeleteShopButton = ({ onDelete, shopId, shopState }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        onDelete();
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <button 
                className="delete-shop-button"
                onClick={handleClick}
                disabled={!shopId}
                aria-label="Delete Shop"
                title="Delete this shop permanently"
            >
                <span className="delete-icon">&#128465;</span>
                <span className="delete-text">Delete Shop</span>
            </button>

            {showConfirmation && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-dialogue">
                        <h3 className="delete-confirm-title">Delete Shop?</h3>
                        <div className="delete-confirm-details">
                            <p className="shop-summary">
                                <span className="shop-summary-label">Shop Name:</span> {shopState.name}<br/>
                                <span className="shop-summary-label">Shopkeeper:</span> {shopState.keeperName}<br/>
                                <span className="shop-summary-label">Shop Type:</span> {shopState.type}<br/>
                                <span className="shop-summary-label">Location:</span> {shopState.location}
                            </p>
                        </div>
                        <p className="delete-confirm-message">
                            Are you sure you want to delete this shop? This action cannot be undone.
                        </p>
                        <div className="delete-confirm-buttons">
                            <button 
                                className="delete-confirm-button delete-confirm-proceed"
                                onClick={handleConfirm}
                            >
                                Delete
                            </button>
                            <button 
                                className="delete-confirm-button delete-confirm-cancel"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

DeleteShopButton.propTypes = {
    onDelete: PropTypes.func.isRequired,
    shopId: PropTypes.string,
    shopState: PropTypes.shape({
        name: PropTypes.string.isRequired,
        keeperName: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired
    }).isRequired
};

export default DeleteShopButton;
