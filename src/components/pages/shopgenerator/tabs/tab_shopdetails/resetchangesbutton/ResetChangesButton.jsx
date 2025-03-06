import { useState } from "react";
import PropTypes from "prop-types";
import "./ResetChangesButton.css";
import UnsavedChangesDialogue from "../../../shared/unsavedchangesdialogue/UnsavedChangesDialogue";

const ResetChangesButton = ({ onReset, shopName, hasUnsavedChanges, changes }) => {
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

    return (
        <>
            <button
                className="reset-changes-button"
                onClick={handleClick}
                disabled={!hasUnsavedChanges}
                aria-label="Revert changes"
            >
                <span className="reset-icon">⎌</span>
                <span className="reset-text">Reset</span>
            </button>

            {showConfirmation && (
                <UnsavedChangesDialogue
                    headerText="Revert All Changes?"
                    description="Are you sure you want to reset all changes made to this shop? This will revert the shop back to its last saved state."
                    changes={changes}
                    currentShopName={shopName}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    continueButtonText="Reset Changes"
                />
            )}
        </>
    );
};

ResetChangesButton.propTypes = {
    onReset: PropTypes.func.isRequired,
    shopName: PropTypes.string.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.object.isRequired,
};

export default ResetChangesButton;
