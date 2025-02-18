import { useState } from 'react';
import PropTypes from 'prop-types';
import './DeleteShopButton.css';
import ActionButton from '../../../shared/actionbutton/ActionButton';

const DeleteShopButton = ({ onDelete, shopId, currentShop }) => {
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
            <ActionButton 
                onClick={handleClick}
                disabled={!shopId}
                icon="&#128465;"
                text="Delete Shop"
                theme="delete"
                title="Delete this shop permanently"
            />

            {showConfirmation && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-dialogue">
                        <h3 className="delete-confirm-title">Delete Shop?</h3>
                        <div className="delete-confirm-details">
                            <p className="shop-summary">
                                <span className="shop-summary-label">Shop Name:</span> {currentShop.name}<br/>
                                <span className="shop-summary-label">Shopkeeper:</span> {currentShop.keeperName}<br/>
                                <span className="shop-summary-label">Shop Type:</span> {currentShop.type}<br/>
                                <span className="shop-summary-label">Location:</span> {currentShop.location}
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
    currentShop: PropTypes.shape({
        name: PropTypes.string.isRequired,
        keeperName: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired
    }).isRequired
};

export default DeleteShopButton;
