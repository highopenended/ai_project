import { useState } from "react";
import PropTypes from "prop-types";
import "./SaveShopButton.css";
import UnsavedChangesDialogue from "../../../shared/UnsavedChangesDialogue";

const SaveShopButton = ({ onSave, areAllDetailsFilled, hasUnsavedChanges, changes, shopName }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        console.log("Save button clicked - Full state:", {
            hasUnsavedChanges,
            showConfirmation,
            shopName,
            willShowConfirmation: hasUnsavedChanges,
            isDisabled: !areAllDetailsFilled(),
            allDetailsFilled: areAllDetailsFilled()
        });
        setShowConfirmation(hasUnsavedChanges); 
    };

    const handleConfirm = () => {
        console.log("Save confirmation dialog confirmed - calling onSave");
        onSave();
        console.log("onSave completed");
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        console.log("Save confirmation dialog cancelled");
        setShowConfirmation(false);
    };

    return (
        <>
            <button 
                className="save-shop-button"
                onClick={() => {
                    console.log("Raw button click event received");
                    handleClick();
                }} 
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
                    currentShopName={shopName}
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
    shopName: PropTypes.string.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.object.isRequired,
};

export default SaveShopButton;
