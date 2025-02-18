import PropTypes from "prop-types";
import "./CloneConfirmDialog.css";

const CloneConfirmDialog = ({ onConfirm, onCancel }) => {
    return (
        <div className="clone-confirm-overlay" onClick={onCancel}>
            {/* e.stopPropagation() prevents the click event from bubbling up to the parent and closing it */}
            <div className="clone-confirm-dialogue" onClick={(e) => e.stopPropagation()}> 
                <h3 className="clone-confirm-title">Clone This Shop?</h3>
                <p className="clone-confirm-message">
                    This will create an exact copy of the current shop with a new ID. The cloned shop will have
                    &quot;(Clone)&quot; appended to its name.
                </p>
                <div className="clone-confirm-buttons">
                    <button className="clone-confirm-button clone-confirm-proceed" onClick={onConfirm}>
                        Clone
                    </button>
                    <button className="clone-confirm-button clone-confirm-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

CloneConfirmDialog.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default CloneConfirmDialog;
