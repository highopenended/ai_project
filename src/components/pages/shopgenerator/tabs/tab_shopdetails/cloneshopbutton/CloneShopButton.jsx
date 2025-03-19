import { useState } from "react";
import PropTypes from "prop-types";
import UnsavedChangesDialogue from "../../../shared/unsavedchangesdialogue/UnsavedChangesDialogue";
import "./CloneShopButton.css";

/**
 * CloneShopButton Component
 *
 * A button component that creates a clone of the current shop with a new ID.
 * The button is disabled when there's no saved shop being edited.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onClone - Callback function to handle shop cloning
 * @param {string} props.shopId - Current shop ID for display
 * @param {Object} props.shopState - Current shop state
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes
 * @param {Object} props.changes - Current changes to the shop
 */
const CloneShopButton = ({ onClone, shopId, shopState, hasUnsavedChanges, changes }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        console.log("Clone button clicked - Full state:", {
            "hasUnsavedChanges:": hasUnsavedChanges,
            "showConfirmation:": showConfirmation,
            "shopName:": shopState.name,
            "willShowConfirmation:": true,
            "isDisabled:": !shopId,
        });
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        console.log("Clone confirmation dialog confirmed - calling onClone");
        onClone();
        console.log("onClone completed");
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        console.log("Clone confirmation dialog cancelled");
        setShowConfirmation(false);
    };

    return (
        <>
            <button
                className="clone-shop-button"
                onClick={handleClick}
                disabled={!shopId}
                aria-label="Clone Shop"
                title={!shopId ? "Save the shop first to enable cloning" : "Create a copy of this shop"}
            >
                <span className="clone-icon">⧉</span>
                <span className="clone-text">Clone</span>
            </button>

            {showConfirmation && (
                <UnsavedChangesDialogue
                    headerText="Clone This Shop?"
                    description={`This will create an exact copy of "${shopState.name}" with "(Clone)" appended to its name.`}
                    changes={changes}
                    currentShopName={shopState.name}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    continueButtonText="Clone Shop"
                />
            )}
        </>
    );
};

CloneShopButton.propTypes = {
    onClone: PropTypes.func.isRequired,
    shopId: PropTypes.string,
    shopState: PropTypes.shape({
        name: PropTypes.string.isRequired,
    }).isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.object.isRequired,
};

export default CloneShopButton;
