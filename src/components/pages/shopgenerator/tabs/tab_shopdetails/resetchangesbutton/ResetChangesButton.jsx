import { useState } from 'react';
import PropTypes from 'prop-types';
import './ResetChangesButton.css';
import UnsavedChangesDialogue from '../../../shared/UnsavedChangesDialogue';

const ResetChangesButton = ({ onReset, hasUnsavedChanges, currentShop, changes }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        onReset();
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    if (!hasUnsavedChanges) return null;

    return (
        <>
            <button 
                className="reset-changes-button"
                onClick={handleClick}
                aria-label="Reset changes"
            >
                <span className="reset-icon">↺</span>
                <span className="reset-text">Reset Changes</span>
            </button>

            {showConfirmation && (
                <UnsavedChangesDialogue
                    title="Reset Changes?"
                    description="Are you sure you want to reset all changes made to this shop? This will revert the shop back to its last saved state."
                    changes={changes}
                    currentShopName={currentShop.shortData.shopName}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmButtonText="Reset Changes"
                />
            )}
        </>
    );
};

ResetChangesButton.propTypes = {
    onReset: PropTypes.func.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    currentShop: PropTypes.shape({
        shortData: PropTypes.shape({
            shopName: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    changes: PropTypes.object.isRequired
};

export default ResetChangesButton;
