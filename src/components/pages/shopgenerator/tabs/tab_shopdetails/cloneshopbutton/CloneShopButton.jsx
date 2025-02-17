import { useState } from "react";
import PropTypes from "prop-types";
import CloneConfirmDialog from "./CloneConfirmDialog";
import ActionButton from "../../../shared/actionbutton/ActionButton";
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
 */
const CloneShopButton = ({ onClone, shopId }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCloneClick = () => {
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        onClone();
        setShowConfirm(false);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    return (
        <>
            <ActionButton
                onClick={handleCloneClick}
                disabled={!shopId}
                icon="⧉"
                text="Clone"
                customClassName="clone-shop-button"
                title={!shopId ? "Save the shop first to enable cloning" : "Create a copy of this shop"}
            />

            {showConfirm && <CloneConfirmDialog onConfirm={handleConfirm} onCancel={handleCancel} />}
        </>
    );
};

CloneShopButton.propTypes = {
    onClone: PropTypes.func.isRequired,
    shopId: PropTypes.string,
};

export default CloneShopButton;
