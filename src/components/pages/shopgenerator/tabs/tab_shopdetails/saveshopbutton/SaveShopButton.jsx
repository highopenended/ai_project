import { useState } from "react";
import PropTypes from "prop-types";
import "./SaveShopButton.css";
import UnsavedChangesDialogue from "../../../shared/UnsavedChangesDialogue";

const SaveShopButton = ({ onSave, areAllDetailsFilled, hasUnsavedChanges, changes, currentShop }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        setShowConfirmation(hasUnsavedChanges); 
    };

    const handleConfirm = () => {
        onSave();
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <button 
                className="save-shop-button"
                onClick={handleClick} 
                disabled={!areAllDetailsFilled()} 
                aria-label="Save"
            >
                <span className="save-icon">&#128427;</span>
                <span className="save-text">Save</span>
            </button>
        {showConfirmation && (
                <UnsavedChangesDialogue
                    headerText={`Save Changes?`}
                    description={`Are you sure you want to save the changes you've made to this shop?`}
                    changes={changes}
                    currentShopName={currentShop.name}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    continueButtonText="Save Changes"
            />
        )}
        </>
    );
};

SaveShopButton.propTypes = {
    onSave: PropTypes.func.isRequired,
    areAllDetailsFilled: PropTypes.func.isRequired,
    currentShop: PropTypes.object.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.object.isRequired,
};

export default SaveShopButton;
